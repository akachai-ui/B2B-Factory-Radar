import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// GET: Fetch activity timeline for a specific lead
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyLeadId = searchParams.get('company_lead_id');
    const companyId = searchParams.get('company_id');

    if (!companyLeadId) {
      return NextResponse.json(
        { error: 'company_lead_id is required' },
        { status: 400 }
      );
    }

    if (pool) {
      try {
        const query = `
          SELECT 
            la.id,
            la.company_id,
            la.company_lead_id,
            la.user_id,
            la.activity_type,
            la.content,
            la.status_change,
            la.deal_value_change,
            la.created_at,
            json_build_object(
              'id', p.id,
              'full_name', COALESCE(p.full_name, p.email, 'Sales Rep'),
              'email', p.email,
              'avatar_url', p.avatar_url,
              'role', p.role
            ) as author
          FROM public.lead_activities la
          LEFT JOIN public.profiles p ON la.user_id = p.id
          WHERE la.company_lead_id = $1 ${companyId ? 'AND la.company_id = $2' : ''}
          ORDER BY la.created_at DESC;
        `;

        const values = companyId ? [companyLeadId, companyId] : [companyLeadId];
        const res = await pool.query(query, values);
        return NextResponse.json({ activities: res.rows });
      } catch (poolErr) {
        console.warn('Activities pool query failed, using Supabase fallback:', poolErr);
      }
    }

    // Supabase fallback
    let sb = supabase
      .from('lead_activities')
      .select('id, company_id, company_lead_id, user_id, activity_type, content, status_change, deal_value_change, created_at, profiles:user_id(id, full_name, email, avatar_url, role)')
      .eq('company_lead_id', companyLeadId);

    if (companyId) {
      sb = sb.eq('company_id', companyId);
    }

    const { data: sbData, error: sbError } = await sb.order('created_at', { ascending: false });
    if (sbError) throw sbError;

    const mapped = (sbData || []).map((row: any) => ({
      ...row,
      author: {
        id: row.profiles?.id || row.user_id,
        full_name: row.profiles?.full_name || row.profiles?.email || 'Sales Rep',
        email: row.profiles?.email || null,
        avatar_url: row.profiles?.avatar_url || null,
        role: row.profiles?.role || null,
      },
    }));

    return NextResponse.json({ activities: mapped });
  } catch (error: any) {
    console.error('Lead activities GET exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new activity note and update parent lead status / latest note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      company_lead_id,
      user_id,
      activity_type = 'NOTE',
      content,
      status_change,
      deal_value_change,
    } = body;

    if (!company_lead_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'company_lead_id and content are required' },
        { status: 400 }
      );
    }

    if (pool) {
      try {
        // 1. Insert into lead_activities
        const insertRes = await pool.query(
          `INSERT INTO public.lead_activities 
            (company_id, company_lead_id, user_id, activity_type, content, status_change, deal_value_change)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *;`,
          [
            company_id || null,
            company_lead_id,
            user_id || null,
            activity_type,
            content.trim(),
            status_change || null,
            deal_value_change !== undefined && !isNaN(Number(deal_value_change)) ? Number(deal_value_change) : null,
          ]
        );

        const newActivity = insertRes.rows[0];

        // 2. Update parent company_leads latest note & last_activity_at
        const updates: string[] = ['notes = $2', 'last_activity_at = NOW()', 'updated_at = NOW()'];
        const values: any[] = [company_lead_id, content.trim()];
        let pIdx = 3;

        if (status_change) {
          updates.push(`status = $${pIdx++}`);
          values.push(status_change);
        }
        if (deal_value_change !== undefined && !isNaN(Number(deal_value_change))) {
          updates.push(`deal_value = $${pIdx++}`);
          values.push(Number(deal_value_change));
        }

        await pool.query(
          `UPDATE public.company_leads SET ${updates.join(', ')} WHERE id = $1;`,
          values
        );

        return NextResponse.json({ success: true, activity: newActivity });
      } catch (poolErr) {
        console.warn('Direct pool insert failed, using Supabase client fallback:', poolErr);
      }
    }

    // Supabase client fallback
    const { data: newActivity, error: actErr } = await supabase
      .from('lead_activities')
      .insert({
        company_id: company_id || null,
        company_lead_id,
        user_id: user_id || null,
        activity_type,
        content: content.trim(),
        status_change: status_change || null,
        deal_value_change: deal_value_change !== undefined && !isNaN(Number(deal_value_change)) ? Number(deal_value_change) : null,
      })
      .select()
      .single();

    if (actErr) throw actErr;

    const leadUpdates: any = {
      notes: content.trim(),
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (status_change) leadUpdates.status = status_change;
    if (deal_value_change !== undefined && !isNaN(Number(deal_value_change))) leadUpdates.deal_value = Number(deal_value_change);

    await supabase.from('company_leads').update(leadUpdates).eq('id', company_lead_id);

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (error: any) {
    console.error('Lead activities POST exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

