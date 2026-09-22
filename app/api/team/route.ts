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
      // Insert new invited member with a new UUID
      const tempId = crypto.randomUUID();
      const inserted = await pool.query(
        `INSERT INTO public.profiles (
           id, email, full_name, role, company_id, company_name, tax_id, branch, phone, account_type, onboarded, status, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'company', true, 'active', NOW(), NOW())
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

    await pool.query(
      `UPDATE public.profiles
       SET company_id = NULL, role = 'owner', account_type = 'individual', updated_at = NOW()
       WHERE id = $1`,
      [memberId]
    );

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

      // 1. Update Profile status
      const updatedProfileRes = await pool.query(
        `UPDATE public.profiles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [newStatus, memberId]
      );

      if (updatedProfileRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
      }

      let releasedCount = 0;

      // 2. If deactivated / inactive, release all their leads to the company unassigned pool (user_id = null)
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

    if (action === 'release_leads') {
      // Release leads of a specific member directly to pool without changing profile status
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
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

