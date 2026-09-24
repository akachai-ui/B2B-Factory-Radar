import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: Fetch Trips (for user active trip, or company list/report)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const active_only = searchParams.get('active_only') === 'true';
    const date = searchParams.get('date');

    if (pool) {
      try {
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (company_id && UUID_REGEX.test(company_id)) {
          conditions.push(`vt.company_id = $${paramIdx++}`);
          values.push(company_id);
        }

        if (user_id && UUID_REGEX.test(user_id)) {
          conditions.push(`vt.user_id = $${paramIdx++}`);
          values.push(user_id);
        }

        if (active_only) {
          conditions.push(`vt.status = 'in_progress'`);
        } else if (status && status !== 'ALL') {
          conditions.push(`vt.status = $${paramIdx++}`);
          values.push(status);
        }

        if (date) {
          conditions.push(`vt.trip_date = $${paramIdx++}`);
          values.push(date);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
          SELECT 
            vt.*,
            p.full_name AS user_name,
            p.email AS user_email,
            p.avatar_url AS user_avatar,
            ap.full_name AS approver_name
          FROM public.vehicle_trips vt
          LEFT JOIN public.profiles p ON vt.user_id = p.id
          LEFT JOIN public.profiles ap ON vt.approved_by = ap.id
          ${whereClause}
          ORDER BY vt.created_at DESC
          LIMIT 100;
        `;

        const res = await pool.query(query, values);
        const trips = res.rows;

        // Fetch checkins for these trips if any
        if (trips.length > 0) {
          const tripIds = trips.map((t: any) => t.id);
          const checkinsRes = await pool.query(
            `SELECT * FROM public.trip_checkins WHERE trip_id = ANY($1::uuid[]) ORDER BY checkin_time ASC`,
            [tripIds]
          );
          
          const checkinMap: Record<string, any[]> = {};
          checkinsRes.rows.forEach((chk: any) => {
            if (!checkinMap[chk.trip_id]) checkinMap[chk.trip_id] = [];
            checkinMap[chk.trip_id].push(chk);
          });

          trips.forEach((t: any) => {
            t.checkins = checkinMap[t.id] || [];
          });
        }

        return NextResponse.json({
          success: true,
          count: trips.length,
          trips,
          activeTrip: active_only ? (trips[0] || null) : undefined,
        });
      } catch (poolErr) {
        console.warn('Trips pool query failed, using Supabase client fallback:', poolErr);
      }
    }

    // Supabase REST Client fallback
    let sb = supabase.from('vehicle_trips').select('*, trip_checkins(*)');
    if (company_id && UUID_REGEX.test(company_id)) {
      sb = sb.eq('company_id', company_id);
    }
    if (user_id && UUID_REGEX.test(user_id)) {
      sb = sb.eq('user_id', user_id);
    }
    if (active_only) {
      sb = sb.eq('status', 'in_progress');
    } else if (status && status !== 'ALL') {
      sb = sb.eq('status', status);
    }
    if (date) {
      sb = sb.eq('trip_date', date);
    }
    sb = sb.order('created_at', { ascending: false }).limit(100);

    const { data: tripsData, error: tripsError } = await sb;
    if (tripsError) throw tripsError;

    const formattedTrips = (tripsData || []).map((t: any) => ({
      ...t,
      checkins: t.trip_checkins || [],
    }));

    return NextResponse.json({
      success: true,
      count: formattedTrips.length,
      trips: formattedTrips,
      activeTrip: active_only ? (formattedTrips[0] || null) : undefined,
    });
  } catch (err: any) {
    console.error('Error fetching trips:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Start a new Trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      user_id,
      vehicle_type = 'car',
      license_plate = '',
      start_odometer,
      start_photo_url = null,
      start_lat = null,
      start_lng = null,
      start_location_name = 'จุดเริ่มต้น',
      fuel_rate_per_km = 5.0,
      trip_date,
    } = body;

    if (!company_id || !user_id || start_odometer === undefined || start_odometer === null) {
      return NextResponse.json(
        { success: false, error: 'company_id, user_id, and start_odometer are required' },
        { status: 400 }
      );
    }

    if (pool) {
      try {
        // Check if user already has an in_progress trip
        const activeCheck = await pool.query(
          `SELECT * FROM public.vehicle_trips WHERE user_id = $1 AND status = 'in_progress' LIMIT 1`,
          [user_id]
        );

        if (activeCheck.rows.length > 0) {
          return NextResponse.json({
            success: true,
            isExisting: true,
            message: 'มีรอบการเดินทางที่กำลังดำเนินอยู่แล้ว',
            trip: activeCheck.rows[0],
          });
        }

        const insertQuery = `
          INSERT INTO public.vehicle_trips (
            company_id,
            user_id,
            vehicle_type,
            license_plate,
            start_odometer,
            start_photo_url,
            start_lat,
            start_lng,
            start_location_name,
            fuel_rate_per_km,
            trip_date,
            status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            COALESCE($11::date, CURRENT_DATE),
            'in_progress'
          )
          RETURNING *;
        `;

        const res = await pool.query(insertQuery, [
          company_id,
          user_id,
          vehicle_type,
          license_plate,
          Number(start_odometer),
          start_photo_url,
          start_lat ? Number(start_lat) : null,
          start_lng ? Number(start_lng) : null,
          start_location_name,
          Number(fuel_rate_per_km) || 5.0,
          trip_date || null,
        ]);

        return NextResponse.json({
          success: true,
          message: 'เริ่มบันทึกรอบการเดินทางสำเร็จ',
          trip: res.rows[0],
        });
      } catch (poolErr) {
        console.warn('Trip POST pool query failed, fallback to Supabase client:', poolErr);
      }
    }

    // Supabase REST Client fallback
    const { data: existingActive } = await supabase
      .from('vehicle_trips')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (existingActive) {
      return NextResponse.json({
        success: true,
        isExisting: true,
        message: 'มีรอบการเดินทางที่กำลังดำเนินอยู่แล้ว',
        trip: existingActive,
      });
    }

    const { data: insertedTrip, error: insertErr } = await supabase
      .from('vehicle_trips')
      .insert({
        company_id,
        user_id,
        vehicle_type,
        license_plate,
        start_odometer: Number(start_odometer),
        start_photo_url,
        start_lat: start_lat ? Number(start_lat) : null,
        start_lng: start_lng ? Number(start_lng) : null,
        start_location_name,
        fuel_rate_per_km: Number(fuel_rate_per_km) || 5.0,
        trip_date: trip_date || new Date().toISOString().split('T')[0],
        status: 'in_progress',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      message: 'เริ่มบันทึกรอบการเดินทางสำเร็จ',
      trip: insertedTrip,
    });
  } catch (err: any) {
    console.error('Error starting trip:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: End trip / Approve / Reject
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      action = 'end', // 'end' | 'approve' | 'reject'
      end_odometer,
      end_photo_url,
      end_lat,
      end_lng,
      end_location_name = 'จุดสิ้นสุดเดินทาง',
      personal_deduct_km = 0,
      fuel_rate_per_km,
      approved_by,
      rejection_reason,
      notes,
    } = body;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Valid Trip ID is required' }, { status: 400 });
    }

    if (pool) {
      try {
        // Fetch existing trip
        const existingRes = await pool.query(`SELECT * FROM public.vehicle_trips WHERE id = $1`, [id]);
        if (existingRes.rows.length === 0) {
          return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
        }
        const currentTrip = existingRes.rows[0];

        if (action === 'end') {
          const endOdo = Number(end_odometer);
          const startOdo = Number(currentTrip.start_odometer);
          const deductKm = Number(personal_deduct_km) || 0;
          const rate = Number(fuel_rate_per_km || currentTrip.fuel_rate_per_km || 5.0);

          const totalOdoKm = Math.max(0, endOdo - startOdo);
          const netClaimableKm = Math.max(0, totalOdoKm - deductKm);
          const totalFuelAmount = Math.round(netClaimableKm * rate * 100) / 100;

          const updateQuery = `
            UPDATE public.vehicle_trips SET
              end_odometer = $1,
              end_photo_url = COALESCE($2, end_photo_url),
              end_time = NOW(),
              end_lat = $3,
              end_lng = $4,
              end_location_name = $5,
              total_odometer_km = $6,
              personal_deduct_km = $7,
              net_claimable_km = $8,
              fuel_rate_per_km = $9,
              total_fuel_amount = $10,
              status = 'completed',
              notes = COALESCE($11, notes),
              updated_at = NOW()
            WHERE id = $12
            RETURNING *;
          `;

          const res = await pool.query(updateQuery, [
            endOdo,
            end_photo_url || null,
            end_lat ? Number(end_lat) : null,
            end_lng ? Number(end_lng) : null,
            end_location_name,
            totalOdoKm,
            deductKm,
            netClaimableKm,
            rate,
            totalFuelAmount,
            notes || null,
            id,
          ]);

          return NextResponse.json({
            success: true,
            message: 'ปิดรอบการเดินทางและส่งคำขอเบิกค่าน้ำมันสำเร็จ',
            trip: res.rows[0],
          });
        }

        if (action === 'approve') {
          if (!approved_by) {
            return NextResponse.json({ success: false, error: 'approved_by is required' }, { status: 400 });
          }

          const res = await pool.query(
            `UPDATE public.vehicle_trips SET
               status = 'approved',
               approved_by = $1,
               approved_at = NOW(),
               rejection_reason = NULL,
               updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [approved_by, id]
          );

          return NextResponse.json({
            success: true,
            message: 'อนุมัติการเบิกจ่ายค่าน้ำมันเรียบร้อยแล้ว',
            trip: res.rows[0],
          });
        }

        if (action === 'reject') {
          if (!approved_by) {
            return NextResponse.json({ success: false, error: 'approved_by is required' }, { status: 400 });
          }

          const res = await pool.query(
            `UPDATE public.vehicle_trips SET
               status = 'rejected',
               approved_by = $1,
               approved_at = NOW(),
               rejection_reason = $2,
               updated_at = NOW()
             WHERE id = $3 RETURNING *`,
            [approved_by, rejection_reason || 'ไม่อนุมัติ', id]
          );

          return NextResponse.json({
            success: true,
            message: 'ปฏิเสธคำขอเบิกจ่ายเรียบร้อย',
            trip: res.rows[0],
          });
        }
      } catch (poolErr) {
        console.warn('Trip PATCH pool query failed, fallback to Supabase client:', poolErr);
      }
    }

    // Supabase REST Client fallback
    const { data: currentTrip, error: fetchErr } = await supabase
      .from('vehicle_trips')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !currentTrip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    if (action === 'end') {
      const endOdo = Number(end_odometer);
      const startOdo = Number(currentTrip.start_odometer);
      const deductKm = Number(personal_deduct_km) || 0;
      const rate = Number(fuel_rate_per_km || currentTrip.fuel_rate_per_km || 5.0);

      const totalOdoKm = Math.max(0, endOdo - startOdo);
      const netClaimableKm = Math.max(0, totalOdoKm - deductKm);
      const totalFuelAmount = Math.round(netClaimableKm * rate * 100) / 100;

      const updatePayload: any = {
        end_odometer: endOdo,
        end_time: new Date().toISOString(),
        end_location_name,
        total_odometer_km: totalOdoKm,
        personal_deduct_km: deductKm,
        net_claimable_km: netClaimableKm,
        fuel_rate_per_km: rate,
        total_fuel_amount: totalFuelAmount,
        status: 'completed',
        updated_at: new Date().toISOString(),
      };

      if (end_photo_url) updatePayload.end_photo_url = end_photo_url;
      if (end_lat !== undefined && end_lat !== null) updatePayload.end_lat = Number(end_lat);
      if (end_lng !== undefined && end_lng !== null) updatePayload.end_lng = Number(end_lng);
      if (notes) updatePayload.notes = notes;

      const { data: updatedTrip, error: updateErr } = await supabase
        .from('vehicle_trips')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: 'ปิดรอบการเดินทางและส่งคำขอเบิกค่าน้ำมันสำเร็จ',
        trip: updatedTrip,
      });
    }

    if (action === 'approve') {
      if (!approved_by) {
        return NextResponse.json({ success: false, error: 'approved_by is required' }, { status: 400 });
      }

      const { data: updatedTrip, error: updateErr } = await supabase
        .from('vehicle_trips')
        .update({
          status: 'approved',
          approved_by,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: 'อนุมัติการเบิกจ่ายค่าน้ำมันเรียบร้อยแล้ว',
        trip: updatedTrip,
      });
    }

    if (action === 'reject') {
      if (!approved_by) {
        return NextResponse.json({ success: false, error: 'approved_by is required' }, { status: 400 });
      }

      const { data: updatedTrip, error: updateErr } = await supabase
        .from('vehicle_trips')
        .update({
          status: 'rejected',
          approved_by,
          approved_at: new Date().toISOString(),
          rejection_reason: rejection_reason || 'ไม่อนุมัติ',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        message: 'ปฏิเสธคำขอเบิกจ่ายเรียบร้อย',
        trip: updatedTrip,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating trip:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
