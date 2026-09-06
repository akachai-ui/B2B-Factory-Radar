import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Fetch all team members under a company_id / owner_id
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const ownerId = searchParams.get('ownerId');

    if (!companyId && !ownerId) {
      return NextResponse.json({ success: false, error: 'Missing companyId or ownerId' }, { status: 400 });
    }

    // Query profiles matching company_id OR id (the owner)
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: true });

    if (companyId) {
      query = query.or(`company_id.eq.${companyId},id.eq.${companyId}`);
    } else if (ownerId) {
      query = query.or(`company_id.eq.${ownerId},id.eq.${ownerId}`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add / Assign member to Team (by Email or User ID)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, role, companyId, companyName, taxId, branch, phone } = body;

    if (!email || !companyId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุอีเมลของสมาชิกและรหัสทีม' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile to join the team
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          company_id: companyId,
          role: role || 'sales',
          company_name: companyName || existingProfile.company_name,
          tax_id: taxId || existingProfile.tax_id,
          branch: branch || existingProfile.branch,
          account_type: 'company',
          onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `เพิ่มคุณ ${existingProfile.full_name || cleanEmail} เข้าสู่ทีมเรียบร้อยแล้ว`,
        member: updated,
      });
    } else {
      // If user hasn't signed in yet, insert a pending profile record
      const tempId = crypto.randomUUID();
      const { data: newMember, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
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
            onboarded: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `เชิญ ${cleanEmail} เข้าสู่ทีมเรียบร้อย (ระบบจะซิงค์อัตโนมัติเมื่อผู้ใช้ล็อกอิน)`,
        member: newMember,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Remove member from Team
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Missing memberId' }, { status: 400 });
    }

    // Set company_id to null and role to owner (revert to solo)
    const { error } = await supabase
      .from('profiles')
      .update({
        company_id: null,
        role: 'owner',
        account_type: 'individual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'นำสมาชิกออกจากทีมเรียบร้อย' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
