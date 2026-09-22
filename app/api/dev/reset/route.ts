import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const results: Record<string, number> = {};

    // 1. Delete lead activities timeline
    const actRes = await pool.query(`DELETE FROM public.lead_activities;`);
    results.lead_activities_deleted = actRes.rowCount || 0;

    // 2. Delete vehicle trips / mileage logs
    const tripRes = await pool.query(`DELETE FROM public.vehicle_trips;`);
    results.vehicle_trips_deleted = tripRes.rowCount || 0;

    // 3. Delete company claimed leads (returns all factories to DBD open market)
    const leadRes = await pool.query(`DELETE FROM public.company_leads;`);
    results.company_leads_deleted = leadRes.rowCount || 0;

    // 4. Delete pending/canceled team invitations
    const invRes = await pool.query(`DELETE FROM public.team_invitations;`);
    results.team_invitations_deleted = invRes.rowCount || 0;

    // 5. Reset all user profiles to 'active' status
    const profRes = await pool.query(
      `UPDATE public.profiles SET status = 'active', updated_at = NOW();`
    );
    results.profiles_reset_active = profRes.rowCount || 0;

    return NextResponse.json({
      success: true,
      message: 'ล้างข้อมูลการทดสอบเรียบร้อยแล้ว ทุกอย่างพร้อมสำหรับการทดสอบรอบใหม่',
      details: results,
    });
  } catch (err: any) {
    console.error('Error resetting test data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
