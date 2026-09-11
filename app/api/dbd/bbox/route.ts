import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const minLat = parseFloat(searchParams.get('minLat') || '5.5');
    const maxLat = parseFloat(searchParams.get('maxLat') || '20.5');
    const minLng = parseFloat(searchParams.get('minLng') || '97.0');
    const maxLng = parseFloat(searchParams.get('maxLng') || '106.0');

    const search = searchParams.get('search')?.trim();
    const province = searchParams.get('province')?.trim();
    const district = searchParams.get('district')?.trim();
    const minCapital = searchParams.get('minCapital') ? parseFloat(searchParams.get('minCapital')!) : null;
    const maxCapital = searchParams.get('maxCapital') ? parseFloat(searchParams.get('maxCapital')!) : null;
    const tsic = searchParams.get('tsic')?.trim();
    const status = searchParams.get('status')?.trim() || 'ACTIVE';
    const limit = Math.min(parseInt(searchParams.get('limit') || '600', 10), 2000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    // Viewport bounds
    conditions.push(`lat >= $${paramIdx++} AND lat <= $${paramIdx++}`);
    values.push(minLat, maxLat);

    conditions.push(`lng >= $${paramIdx++} AND lng <= $${paramIdx++}`);
    values.push(minLng, maxLng);

    // Status
    if (status !== 'ALL') {
      conditions.push(`status = $${paramIdx++}`);
      values.push(status);
    }

    // Province filter
    if (province && province !== 'ALL' && province !== 'ทุกจังหวัด') {
      conditions.push(`province = $${paramIdx++}`);
      values.push(province);
    }

    // District filter
    if (district && district !== 'ALL' && district !== 'ทุกอำเภอ/เขต') {
      conditions.push(`district = $${paramIdx++}`);
      values.push(district);
    }

    // Capital filter
    if (minCapital !== null && !isNaN(minCapital)) {
      conditions.push(`registered_capital >= $${paramIdx++}`);
      values.push(minCapital);
    }
    if (maxCapital !== null && !isNaN(maxCapital)) {
      conditions.push(`registered_capital <= $${paramIdx++}`);
      values.push(maxCapital);
    }

    // TSIC filter
    if (tsic && tsic !== 'ALL') {
      conditions.push(`tsic_code LIKE $${paramIdx++}`);
      values.push(`${tsic}%`);
    }

    // Search query (fuzzy name / tax_id / objective)
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR tax_id ILIKE $${paramIdx} OR objective ILIKE $${paramIdx})`);
      values.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total matching count in view
    const countQuery = `SELECT count(*) FROM public.dbd_companies ${whereClause};`;
    const countRes = await pool.query(countQuery, values);
    const totalInView = parseInt(countRes.rows[0]?.count || '0', 10);

    // Records
    const dataQuery = `
      SELECT 
        id,
        tax_id,
        name,
        registered_capital,
        tsic_code,
        objective,
        address,
        subdistrict,
        district,
        province,
        postal_code,
        registration_date,
        dissolution_date,
        status,
        lat,
        lng
      FROM public.dbd_companies
      ${whereClause}
      ORDER BY registered_capital DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;

    const dataRes = await pool.query(dataQuery, [...values, limit, offset]);

    return NextResponse.json({
      success: true,
      totalInView,
      count: dataRes.rows.length,
      companies: dataRes.rows
    });
  } catch (err: any) {
    console.error('Error fetching DBD bbox companies:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
