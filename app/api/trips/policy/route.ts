import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_POLICY = {
  car_rate_per_km: 5.0,
  motorcycle_rate_per_km: 2.5,
  van_rate_per_km: 6.0,
  calculation_mode: 'odometer',
  variance_tolerance_pct: 15.0,
  require_photo_odometer: true,
  require_client_checkin: true,
  allow_sales_override_rate: false,
};

// GET: Fetch Company Fuel Policy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');

    if (!company_id || !UUID_REGEX.test(company_id)) {
      return NextResponse.json({
        success: true,
        isDefault: true,
        policy: DEFAULT_POLICY,
      });
    }

    const res = await pool.query(
      `SELECT * FROM public.company_fuel_policies WHERE company_id = $1 LIMIT 1`,
      [company_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({
        success: true,
        isDefault: true,
        policy: { ...DEFAULT_POLICY, company_id },
      });
    }

    return NextResponse.json({
      success: true,
      isDefault: false,
      policy: res.rows[0],
    });
  } catch (err: any) {
    console.error('Error fetching fuel policy:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Upsert Company Fuel Policy (Owner / Manager only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      car_rate_per_km = 5.0,
      motorcycle_rate_per_km = 2.5,
      van_rate_per_km = 6.0,
      calculation_mode = 'odometer',
      variance_tolerance_pct = 15.0,
      require_photo_odometer = true,
      require_client_checkin = true,
      allow_sales_override_rate = false,
    } = body;

    if (!company_id || !UUID_REGEX.test(company_id)) {
      return NextResponse.json({ success: false, error: 'Valid company_id is required' }, { status: 400 });
    }

    const upsertQuery = `
      INSERT INTO public.company_fuel_policies (
        company_id,
        car_rate_per_km,
        motorcycle_rate_per_km,
        van_rate_per_km,
        calculation_mode,
        variance_tolerance_pct,
        require_photo_odometer,
        require_client_checkin,
        allow_sales_override_rate,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
      ON CONFLICT (company_id) DO UPDATE SET
        car_rate_per_km = EXCLUDED.car_rate_per_km,
        motorcycle_rate_per_km = EXCLUDED.motorcycle_rate_per_km,
        van_rate_per_km = EXCLUDED.van_rate_per_km,
        calculation_mode = EXCLUDED.calculation_mode,
        variance_tolerance_pct = EXCLUDED.variance_tolerance_pct,
        require_photo_odometer = EXCLUDED.require_photo_odometer,
        require_client_checkin = EXCLUDED.require_client_checkin,
        allow_sales_override_rate = EXCLUDED.allow_sales_override_rate,
        updated_at = NOW()
      RETURNING *;
    `;

    const res = await pool.query(upsertQuery, [
      company_id,
      Number(car_rate_per_km) || 5.0,
      Number(motorcycle_rate_per_km) || 2.5,
      Number(van_rate_per_km) || 6.0,
      calculation_mode || 'odometer',
      Number(variance_tolerance_pct) || 15.0,
      Boolean(require_photo_odometer),
      Boolean(require_client_checkin),
      Boolean(allow_sales_override_rate),
    ]);

    return NextResponse.json({
      success: true,
      message: 'บันทึกนโยบายค่าน้ำมันของบริษัทสำเร็จ',
      policy: res.rows[0],
    });
  } catch (err: any) {
    console.error('Error saving fuel policy:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
