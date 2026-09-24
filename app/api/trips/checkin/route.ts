import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Haversine formula to calculate distance between two coordinates in Kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

// GET: Get Checkins for a trip
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trip_id = searchParams.get('trip_id');

    if (!trip_id || !UUID_REGEX.test(trip_id)) {
      return NextResponse.json({ success: false, error: 'Valid trip_id is required' }, { status: 400 });
    }

    if (pool) {
      try {
        const res = await pool.query(
          `SELECT * FROM public.trip_checkins WHERE trip_id = $1 ORDER BY checkin_time ASC`,
          [trip_id]
        );

        return NextResponse.json({
          success: true,
          count: res.rows.length,
          checkins: res.rows,
        });
      } catch (poolErr) {
        console.warn('Checkin GET pool query failed, fallback to Supabase:', poolErr);
      }
    }

    // Supabase fallback
    const { data: checkins, error: chkErr } = await supabase
      .from('trip_checkins')
      .select('*')
      .eq('trip_id', trip_id)
      .order('checkin_time', { ascending: true });

    if (chkErr) throw chkErr;

    return NextResponse.json({
      success: true,
      count: (checkins || []).length,
      checkins: checkins || [],
    });
  } catch (err: any) {
    console.error('Error fetching checkins:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Record a Checkin at a Lead / Stop during a Trip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trip_id,
      company_id,
      user_id,
      company_lead_id = null,
      checkin_type = 'CLIENT_VISIT',
      location_name,
      lat,
      lng,
      photo_url = null,
      notes = null,
    } = body;

    if (!trip_id || !company_id || !user_id || lat === undefined || lng === undefined || !location_name) {
      return NextResponse.json(
        { success: false, error: 'trip_id, company_id, user_id, location_name, lat, lng are required' },
        { status: 400 }
      );
    }

    if (pool) {
      try {
        // 1. Fetch Trip & previous checkin to compute incremental distance
        const tripRes = await pool.query(`SELECT * FROM public.vehicle_trips WHERE id = $1`, [trip_id]);
        if (tripRes.rows.length === 0) {
          return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
        }
        const trip = tripRes.rows[0];

        // Find previous coordinate
        const lastCheckinRes = await pool.query(
          `SELECT lat, lng FROM public.trip_checkins WHERE trip_id = $1 ORDER BY checkin_time DESC LIMIT 1`,
          [trip_id]
        );

        let prevLat = trip.start_lat;
        let prevLng = trip.start_lng;

        if (lastCheckinRes.rows.length > 0) {
          prevLat = lastCheckinRes.rows[0].lat;
          prevLng = lastCheckinRes.rows[0].lng;
        }

        let distanceFromPrevKm = 0;
        if (prevLat !== null && prevLng !== null && lat !== null && lng !== null) {
          distanceFromPrevKm = calculateHaversineDistanceKm(
            Number(prevLat),
            Number(prevLng),
            Number(lat),
            Number(lng)
          );
        }

        // 2. Insert checkin record
        const insertCheckinQuery = `
          INSERT INTO public.trip_checkins (
            trip_id,
            company_id,
            user_id,
            company_lead_id,
            checkin_type,
            location_name,
            lat,
            lng,
            distance_from_prev_km,
            photo_url,
            notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ) RETURNING *;
        `;

        const checkinRes = await pool.query(insertCheckinQuery, [
          trip_id,
          company_id,
          user_id,
          company_lead_id,
          checkin_type,
          location_name,
          Number(lat),
          Number(lng),
          distanceFromPrevKm,
          photo_url,
          notes,
        ]);

        // 3. Update vehicle_trips total_route_km
        const currentTotalRouteKm = Number(trip.total_route_km) || 0;
        const newTotalRouteKm = Math.round((currentTotalRouteKm + distanceFromPrevKm) * 10) / 10;

        await pool.query(
          `UPDATE public.vehicle_trips SET total_route_km = $1, updated_at = NOW() WHERE id = $2`,
          [newTotalRouteKm, trip_id]
        );

        return NextResponse.json({
          success: true,
          message: 'บันทึกจุดเช็คอินสำเร็จ',
          checkin: checkinRes.rows[0],
          total_route_km: newTotalRouteKm,
          distance_from_prev_km: distanceFromPrevKm,
        });
      } catch (poolErr) {
        console.warn('Checkin POST pool query failed, fallback to Supabase:', poolErr);
      }
    }

    // Supabase REST Client fallback
    const { data: trip, error: tripFetchErr } = await supabase
      .from('vehicle_trips')
      .select('*')
      .eq('id', trip_id)
      .maybeSingle();

    if (tripFetchErr || !trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    const { data: lastCheckin } = await supabase
      .from('trip_checkins')
      .select('lat, lng')
      .eq('trip_id', trip_id)
      .order('checkin_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    let prevLat = trip.start_lat;
    let prevLng = trip.start_lng;

    if (lastCheckin) {
      prevLat = lastCheckin.lat;
      prevLng = lastCheckin.lng;
    }

    let distanceFromPrevKm = 0;
    if (prevLat !== null && prevLng !== null && lat !== null && lng !== null) {
      distanceFromPrevKm = calculateHaversineDistanceKm(
        Number(prevLat),
        Number(prevLng),
        Number(lat),
        Number(lng)
      );
    }

    const { data: checkinRecord, error: checkinInsertErr } = await supabase
      .from('trip_checkins')
      .insert({
        trip_id,
        company_id,
        user_id,
        company_lead_id,
        checkin_type,
        location_name,
        lat: Number(lat),
        lng: Number(lng),
        distance_from_prev_km: distanceFromPrevKm,
        photo_url,
        notes,
      })
      .select()
      .single();

    if (checkinInsertErr) throw checkinInsertErr;

    const currentTotalRouteKm = Number(trip.total_route_km) || 0;
    const newTotalRouteKm = Math.round((currentTotalRouteKm + distanceFromPrevKm) * 10) / 10;

    await supabase
      .from('vehicle_trips')
      .update({ total_route_km: newTotalRouteKm, updated_at: new Date().toISOString() })
      .eq('id', trip_id);

    return NextResponse.json({
      success: true,
      message: 'บันทึกจุดเช็คอินสำเร็จ',
      checkin: checkinRecord,
      total_route_km: newTotalRouteKm,
      distance_from_prev_km: distanceFromPrevKm,
    });
  } catch (err: any) {
    console.error('Error recording checkin:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
