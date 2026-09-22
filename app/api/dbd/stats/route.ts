import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const totalRes = await pool.query(`
      SELECT 
        count(*) as total_companies,
        count(*) FILTER (WHERE status = 'ACTIVE') as active_companies,
        sum(registered_capital) as total_capital,
        max(registered_capital) as max_capital
      FROM public.dbd_companies;
    `);

    const topProvincesRes = await pool.query(`
      SELECT province, count(*) as count, sum(registered_capital) as total_capital
      FROM public.dbd_companies
      WHERE province IS NOT NULL AND province != ''
      GROUP BY province
      ORDER BY count DESC
      LIMIT 10;
    `);

    return NextResponse.json({
      success: true,
      stats: totalRes.rows[0],
      topProvinces: topProvincesRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching DBD stats:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
