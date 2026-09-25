import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const log: string[] = [];
  try {
    // 1. Update Database Trigger handle_new_user if pool is available
    if (pool) {
      try {
        await pool.query(`
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS TRIGGER AS $$
          DECLARE
            v_full_name TEXT;
            v_company_name TEXT;
            v_invite RECORD;
          BEGIN
            v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

            -- 0. Check if this email has an existing pending or accepted team invitation
            SELECT * INTO v_invite 
            FROM public.team_invitations 
            WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
              AND status IN ('pending', 'accepted')
            ORDER BY created_at DESC 
            LIMIT 1;

            IF v_invite.id IS NOT NULL THEN
              -- A. User was invited by a Company Owner: Link directly to the company (NO new company row)
              INSERT INTO public.profiles (
                id, email, full_name, company_name, company_id, account_type, role, access_status, onboarded
              )
              VALUES (
                NEW.id,
                NEW.email,
                v_full_name,
                v_invite.company_name,
                v_invite.company_id,
                'company',
                COALESCE(v_invite.role, 'sales'),
                'PRO_UNLOCKED',
                TRUE
              )
              ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                company_id = v_invite.company_id,
                company_name = v_invite.company_name,
                role = COALESCE(v_invite.role, 'sales'),
                access_status = 'PRO_UNLOCKED',
                onboarded = TRUE;

              -- Mark invitation as accepted
              UPDATE public.team_invitations
              SET status = 'accepted', updated_at = timezone('utc'::text, now())
              WHERE id = v_invite.id;

            ELSE
              -- B. Standalone User: Create personal company record and owner profile
              v_company_name := 'ทีมของ ' || v_full_name;

              INSERT INTO public.companies (id, name, branch, owner_id)
              VALUES (NEW.id, v_company_name, 'สำนักงานใหญ่', NEW.id)
              ON CONFLICT (id) DO NOTHING;

              INSERT INTO public.profiles (id, email, full_name, company_name, company_id, account_type, role, onboarded)
              VALUES (
                NEW.id,
                NEW.email,
                v_full_name,
                v_company_name,
                NEW.id,
                'company',
                'owner',
                TRUE
              )
              ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
                company_id = COALESCE(public.profiles.company_id, EXCLUDED.company_id),
                company_name = COALESCE(public.profiles.company_name, EXCLUDED.company_name);
            END IF;

            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
        log.push('Updated handle_new_user Postgres trigger successfully');
      } catch (poolErr: any) {
        log.push(`Pool trigger update notice: ${poolErr.message}`);
      }
    }

    // 2. Fetch all team_invitations
    const { data: invitations } = await supabase
      .from('team_invitations')
      .select('*')
      .in('status', ['pending', 'accepted']);

    let updatedProfilesCount = 0;
    let deletedCompaniesCount = 0;

    if (invitations && invitations.length > 0) {
      for (const inv of invitations) {
        const cleanEmail = inv.email.toLowerCase().trim();

        // Check if there is a profile with this email
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (prof) {
          // If profile is not in the invited company or has dummy company
          if (prof.company_id !== inv.company_id || prof.role === 'owner') {
            const dummyCompId = prof.id;

            // Delete dummy company
            if (dummyCompId && dummyCompId !== inv.company_id) {
              const { error: delErr } = await supabase
                .from('companies')
                .delete()
                .eq('id', dummyCompId);
              if (!delErr) deletedCompaniesCount++;
            }

            // Update profile to belong to inv.company_id
            await supabase
              .from('profiles')
              .update({
                company_id: inv.company_id,
                company_name: inv.company_name,
                role: inv.role || 'sales',
                account_type: 'company',
                access_status: 'PRO_UNLOCKED',
                onboarded: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', prof.id);

            updatedProfilesCount++;
          }
        }
      }
    }

    // 3. Mark all matched invitations as accepted
    await supabase
      .from('team_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .in('status', ['pending', 'accepted']);

    return NextResponse.json({
      success: true,
      log,
      updatedProfilesCount,
      deletedCompaniesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, log }, { status: 500 });
  }
}
