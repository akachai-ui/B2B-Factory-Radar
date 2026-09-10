import { NextResponse } from 'next/server';
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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`company_id.eq.${companyId},id.eq.${companyId}`)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

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
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
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
      // Insert new invited member with a new UUID
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
        message: `เชิญ ${cleanEmail} เข้าสู่ทีมเรียบร้อย!`,
        member: newMember,
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
