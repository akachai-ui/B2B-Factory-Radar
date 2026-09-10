import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, companyId, companyName, inviterName, inviterEmail, inviteId } = body;

    if (!email || !companyId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุอีเมลและรหัสบริษัท' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let finalInviteId = inviteId;
    let newInvite = null;

    // 1. Insert Invitation into team_invitations table if not already inserted
    if (!finalInviteId) {
      const { data: inserted, error: insertError } = await supabase
        .from('team_invitations')
        .insert([
          {
            company_id: companyId,
            company_name: companyName || 'บริษัทของฉัน',
            email: cleanEmail,
            role: role || 'sales',
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
      finalInviteId = inserted.id;
      newInvite = inserted;
    }

    // 2. Generate Invite Acceptance URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${origin}/invite/accept?invite_id=${finalInviteId}`;

    // 3. Send Email via Google Apps Script (Gmail API) or Resend
    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let mailProvider = 'none';

    // Option A: Google Apps Script (Central Gmail Mailer)
    if (appsScriptUrl) {
      try {
        const gasRes = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            role: role || 'sales',
            companyId,
            companyName: companyName || 'บริษัทของฉัน',
            inviterName: inviterName || inviterEmail || 'หัวหน้าทีม',
            inviterEmail: inviterEmail || '',
            inviteUrl,
          }),
        });

        if (gasRes.ok) {
          const gasJson = await gasRes.json().catch(() => null);
          if (gasJson && gasJson.success) {
            emailSent = true;
            mailProvider = 'google_apps_script';
          } else {
            console.warn('Google Apps Script mailer error:', gasJson?.error);
          }
        }
      } catch (gasErr) {
        console.warn('Send email via Google Apps Script failed:', gasErr);
      }
    }

    // Option B: Resend (if Apps Script is not configured or as fallback)
    if (!emailSent && resendApiKey) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 40px 20px; }
                .card { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 24px; padding: 36px; text-align: center; }
                .badge { display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; font-size: 12px; font-weight: bold; border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 20px; }
                h1 { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 12px 0; }
                p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
                .company-box { background-color: #070b14; border: 1px solid #1e293b; border-radius: 16px; padding: 20px; margin-bottom: 28px; text-align: left; }
                .company-title { color: #f59e0b; font-size: 16px; font-weight: bold; margin-bottom: 4px; }
                .company-role { color: #cbd5e1; font-size: 13px; }
                .btn { display: inline-block; width: 100%; box-sizing: border-box; padding: 14px 28px; border-radius: 16px; background: linear-gradient(135deg, #f59e0b, #eab308); color: #020617; font-size: 14px; font-weight: 900; text-decoration: none; text-align: center; }
                .footer { margin-top: 24px; font-size: 11px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="badge">✨ RouteHunter B2B Radar</div>
                <h1>คำเชิญเข้าร่วมทีม</h1>
                <p>คุณได้รับคำเชิญจาก <strong>${inviterName || inviterEmail || 'หัวหน้าทีม'}</strong> ให้เข้าร่วมสังกัดทีมบนระบบ RouteHunter เพื่อใช้งานฐานข้อมูลโรงงานและวางรูทงานขายร่วมกัน</p>
                
                <div class="company-box">
                  <div class="company-title">🏢 ${companyName || 'Innovatech.Co.,Ltd'}</div>
                  <div class="company-role">💼 ตำแหน่งที่ได้รับ: <strong>${role === 'manager' ? 'ผู้จัดการ (Manager)' : 'ทีมเซลส์ (Sales)'}</strong></div>
                </div>

                <a href="${inviteUrl}" class="btn">👉 คลิกที่นี่เพื่อตอบรับคำเชิญ & เข้าสู่ระบบ</a>

                <div class="footer">
                  หากปุ่มกดไม่ได้ สามารถเปิดลิงก์นี้ในเบราว์เซอร์:<br>
                  <a href="${inviteUrl}" style="color: #38bdf8; word-break: break-all;">${inviteUrl}</a>
                </div>
              </div>
            </body>
          </html>
        `;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'RouteHunter <invitations@b2bfactoryradar.com>',
            to: [cleanEmail],
            subject: `🎉 ${inviterName || 'หัวหน้าทีม'} ได้เชิญคุณเข้าร่วมทีม ${companyName || 'Innovatech.Co.,Ltd'}`,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          mailProvider = 'resend';
        }
      } catch (e) {
        console.warn('Send email via Resend failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      invite: newInvite,
      inviteUrl,
      emailSent,
      mailProvider,
      message: emailSent
        ? `ส่งอีเมลคำเชิญไปยัง ${cleanEmail} สำเร็จแล้ว`
        : `สร้างคำเชิญสำหรับ ${cleanEmail} เรียบร้อยแล้ว (สามารถคัดลอกลิงก์ส่งได้ทันที)`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
