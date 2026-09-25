import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Fetch team members
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Missing companyId' }, { status: 400 });
    }

    if (pool) {
      try {
        const res = await pool.query(
          `SELECT * FROM public.profiles WHERE company_id = $1 OR id = $1 ORDER BY created_at ASC`,
          [companyId]
        );
        return NextResponse.json({ success: true, members: res.rows || [] });
      } catch (poolErr) {
        console.warn('Team pool query failed, using Supabase client fallback:', poolErr);
      }
    }

    // Supabase REST Client fallback
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`company_id.eq.${companyId},id.eq.${companyId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, members: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add or Invite team member (Executed on Server)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, role, companyId, companyName, taxId, branch, phone } = body;

    if (!email || !companyId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุอีเมลและรหัสทีม' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (pool) {
      try {
        // Check if user already exists
        const existing = await pool.query(
          `SELECT * FROM public.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [cleanEmail]
        );

        if (existing.rows.length > 0) {
          const existingProfile = existing.rows[0];
          const updated = await pool.query(
            `UPDATE public.profiles
             SET company_id = $1,
                 role = $2,
                 company_name = COALESCE($3, company_name),
                 tax_id = COALESCE($4, tax_id),
                 branch = COALESCE($5, branch),
                 account_type = 'company',
                 access_status = 'PRO_UNLOCKED',
                 onboarded = true,
                 status = 'active',
                 updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [
              companyId,
              role || 'sales',
              companyName || existingProfile.company_name,
              taxId || existingProfile.tax_id,
              branch || existingProfile.branch,
              existingProfile.id,
            ]
          );

          return NextResponse.json({
            success: true,
            message: `เพิ่มคุณ ${existingProfile.full_name || cleanEmail} เข้าสู่ทีมเรียบร้อยแล้ว`,
            member: updated.rows[0],
          });
        } else {
          // Insert new invited member with a new UUID and PRO_UNLOCKED
          const tempId = crypto.randomUUID();
          const inserted = await pool.query(
            `INSERT INTO public.profiles (
               id, email, full_name, role, company_id, company_name, tax_id, branch, phone, account_type, access_status, onboarded, status, created_at, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'company', 'PRO_UNLOCKED', true, 'active', NOW(), NOW())
             RETURNING *`,
            [
              tempId,
              cleanEmail,
              fullName || cleanEmail.split('@')[0],
              role || 'sales',
              companyId,
              companyName || 'ทีมของฉัน',
              taxId || null,
              branch || 'สำนักงานใหญ่',
              phone || null,
            ]
          );

          return NextResponse.json({
            success: true,
            message: `เชิญ ${cleanEmail} เข้าสู่ทีมเรียบร้อย!`,
            member: inserted.rows[0],
          });
        }
      } catch (poolErr) {
        console.warn('Team POST pool failed, fallback to Supabase:', poolErr);
      }
    }

    // Supabase REST Client fallback
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      const { data: updatedProfile, error: upErr } = await supabase
        .from('profiles')
        .update({
          company_id: companyId,
          role: role || 'sales',
          company_name: companyName || existingProfile.company_name,
          tax_id: taxId || existingProfile.tax_id,
          branch: branch || existingProfile.branch,
          account_type: 'company',
          access_status: 'PRO_UNLOCKED',
          onboarded: true,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (upErr) throw upErr;

      return NextResponse.json({
        success: true,
        message: `เพิ่มคุณ ${existingProfile.full_name || cleanEmail} เข้าสู่ทีมเรียบร้อยแล้ว`,
        member: updatedProfile,
      });
    } else {
      const tempId = crypto.randomUUID();
      const { data: insertedProfile, error: insErr } = await supabase
        .from('profiles')
        .insert({
          id: tempId,
          email: cleanEmail,
          full_name: fullName || cleanEmail.split('@')[0],
          role: role || 'sales',
          company_id: companyId,
          company_name: companyName || 'ทีมของฉัน',
          tax_id: taxId || null,
          branch: branch || 'สำนักงานใหญ่',
          phone: phone || null,
          account_type: 'company',
          access_status: 'PRO_UNLOCKED',
          onboarded: true,
          status: 'active',
        })
        .select()
        .single();

      if (insErr) throw insErr;

      return NextResponse.json({
        success: true,
        message: `เชิญ ${cleanEmail} เข้าสู่ทีมเรียบร้อย!`,
        member: insertedProfile,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Remove member from team
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Missing memberId' }, { status: 400 });
    }

    if (pool) {
      try {
        await pool.query(
          `UPDATE public.profiles
           SET company_id = NULL, role = 'owner', account_type = 'company', updated_at = NOW()
           WHERE id = $1`,
          [memberId]
        );

        return NextResponse.json({ success: true, message: 'นำสมาชิกออกจากทีมเรียบร้อย' });
      } catch (poolErr) {
        console.warn('Team DELETE pool failed, fallback to Supabase:', poolErr);
      }
    }

    // Supabase fallback
    const { error: upErr } = await supabase
      .from('profiles')
      .update({
        company_id: null,
        role: 'owner',
        account_type: 'company',
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (upErr) throw upErr;

    return NextResponse.json({ success: true, message: 'นำสมาชิกออกจากทีมเรียบร้อย' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Toggle Member Status (active / inactive) or Reassign / Release leads
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { memberId, companyId, status, action = 'toggle_status' } = body;

    if (!memberId || !companyId) {
      return NextResponse.json({ success: false, error: 'Missing memberId or companyId' }, { status: 400 });
    }

    if (action === 'toggle_status') {
      const newStatus = status === 'inactive' ? 'inactive' : 'active';

      if (pool) {
        try {
          const updatedProfileRes = await pool.query(
            `UPDATE public.profiles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [newStatus, memberId]
          );

          if (updatedProfileRes.rows.length > 0) {
            let releasedCount = 0;
            if (newStatus === 'inactive') {
              const updatedLeadsRes = await pool.query(
                `UPDATE public.company_leads
                 SET user_id = NULL, updated_at = NOW()
                 WHERE company_id = $1 AND user_id = $2
                 RETURNING id`,
                [companyId, memberId]
              );
              releasedCount = updatedLeadsRes.rows.length;
            }

            return NextResponse.json({
              success: true,
              message:
                newStatus === 'inactive'
                  ? `ปรับสถานะเป็น Inactive เรียบร้อย และย้ายลูกค้า ${releasedCount} แห่งเข้าคลังลูกค้ารอจัดสรร`
                  : `เปิดใช้งานบัญชี (Active) เรียบร้อยแล้ว`,
              member: updatedProfileRes.rows[0],
              releasedCount,
            });
          }
        } catch (poolErr) {
          console.warn('Team PATCH toggle status pool failed, fallback to Supabase:', poolErr);
        }
      }

      // Supabase fallback
      const { data: updatedProfile, error: upErr } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .select()
        .single();

      if (upErr) throw upErr;

      let releasedCount = 0;
      if (newStatus === 'inactive') {
        const { data: releasedLeads } = await supabase
          .from('company_leads')
          .update({ user_id: null, updated_at: new Date().toISOString() })
          .eq('company_id', companyId)
          .eq('user_id', memberId)
          .select('id');
        releasedCount = (releasedLeads || []).length;
      }

      return NextResponse.json({
        success: true,
        message:
          newStatus === 'inactive'
            ? `ปรับสถานะเป็น Inactive เรียบร้อย และย้ายลูกค้า ${releasedCount} แห่งเข้าคลังลูกค้ารอจัดสรร`
            : `เปิดใช้งานบัญชี (Active) เรียบร้อยแล้ว`,
        member: updatedProfile,
        releasedCount,
      });
    }

    if (action === 'release_leads') {
      if (pool) {
        try {
          const updatedLeadsRes = await pool.query(
            `UPDATE public.company_leads
             SET user_id = NULL, updated_at = NOW()
             WHERE company_id = $1 AND user_id = $2
             RETURNING id`,
            [companyId, memberId]
          );

          return NextResponse.json({
            success: true,
            message: `ย้ายลูกค้า ${updatedLeadsRes.rows.length} แห่งเข้าคลังลูกค้ารอจัดสรรเรียบร้อย`,
            releasedCount: updatedLeadsRes.rows.length,
          });
        } catch (poolErr) {
          console.warn('Team PATCH release leads pool failed, fallback to Supabase:', poolErr);
        }
      }

      // Supabase fallback
      const { data: releasedLeads, error: relErr } = await supabase
        .from('company_leads')
        .update({ user_id: null, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('user_id', memberId)
        .select('id');

      if (relErr) throw relErr;

      return NextResponse.json({
        success: true,
        message: `ย้ายลูกค้า ${(releasedLeads || []).length} แห่งเข้าคลังลูกค้ารอจัดสรรเรียบร้อย`,
        releasedCount: (releasedLeads || []).length,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

