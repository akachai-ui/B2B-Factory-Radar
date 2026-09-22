import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');

    if (!company_id || !UUID_REGEX.test(company_id)) {
      return NextResponse.json({ success: true, dbd_ids: [], lead_ids: [], claimed_map: {} });
    }

    let rows: any[] = [];
    let poolSucceeded = false;

    if (pool) {
      try {
        const res = await pool.query(
          `SELECT cl.id, cl.dbd_id, cl.lead_id, cl.user_id, cl.status, p.full_name as claimed_by_name, p.avatar_url
           FROM public.company_leads cl
           LEFT JOIN public.profiles p ON cl.user_id = p.id
           WHERE cl.company_id = $1;`,
          [company_id]
        );
        rows = res.rows;
        poolSucceeded = true;
      } catch (poolErr) {
        console.warn('Claimed IDs pool query failed, using Supabase fallback:', poolErr);
      }
    }

    // Supabase fallback if pool failed
    if (!poolSucceeded) {
      let sbRes = await supabase
        .from('company_leads')
        .select('id, dbd_id, lead_id, user_id, status, profiles:user_id(full_name, avatar_url)')
        .eq('company_id', company_id);

      if (sbRes.error && (sbRes.error.message.includes('dbd_id') || sbRes.error.code === 'PGRST204')) {
        // Safe fallback without dbd_id if column hasn't been migrated yet on cloud
        sbRes = await supabase
          .from('company_leads')
          .select('id, lead_id, user_id, status, profiles:user_id(full_name, avatar_url)')
          .eq('company_id', company_id);
      }

      if (!sbRes.error && sbRes.data) {
        rows = sbRes.data.map((r: any) => ({
          id: r.id,
          dbd_id: (r as any).dbd_id || null,
          lead_id: (r as any).lead_id || null,
          user_id: r.user_id,
          status: r.status,
          claimed_by_name: (r as any).profiles?.full_name || null,
          avatar_url: (r as any).profiles?.avatar_url || null,
        }));
      }
    }

    const dbd_ids: (string | number)[] = [];
    const lead_ids: (string | number)[] = [];
    const claimed_map: Record<string, { user_id: string; claimed_by_name: string; avatar_url?: string | null; status?: string }> = {};

    rows.forEach((row) => {
      const claimInfo = {
        user_id: row.user_id,
        claimed_by_name: row.claimed_by_name || 'เพื่อนในทีม',
        avatar_url: row.avatar_url || null,
        status: row.status || 'NEW',
      };

      if (row.dbd_id) {
        dbd_ids.push(row.dbd_id);
        claimed_map[`dbd_${row.dbd_id}`] = claimInfo;
      }
      if (row.lead_id) {
        lead_ids.push(row.lead_id);
        claimed_map[`lead_${row.lead_id}`] = claimInfo;
      }
    });

    return NextResponse.json({
      success: true,
      total_claimed: rows.length,
      dbd_ids,
      lead_ids,
      claimed_map,
    });
  } catch (err: any) {
    console.error('Error fetching claimed IDs:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

