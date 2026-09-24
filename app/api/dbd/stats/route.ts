import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (pool) {
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
      } catch (poolErr) {
        console.warn('DBD Stats pool query failed, fallback to Supabase:', poolErr);
      }
    }

    // Supabase fallback
    const { count: totalCompanies } = await supabase.from('dbd_companies').select('*', { count: 'exact', head: true });
    const { count: activeCompanies } = await supabase.from('dbd_companies').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');

    return NextResponse.json({
      success: true,
      stats: {
        total_companies: totalCompanies || 0,
        active_companies: activeCompanies || 0,
        total_capital: 0,
        max_capital: 0,
      },
      topProvinces: []
    });
  } catch (err: any) {
    console.error('Error fetching DBD stats:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
