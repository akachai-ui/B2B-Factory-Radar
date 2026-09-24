import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { url, lead_id, tax_id, manualLat, manualLng } = await request.json();

    let resolvedLat: number | null = null;
    let resolvedLng: number | null = null;

    if (manualLat !== undefined && manualLng !== undefined && manualLat !== '' && manualLng !== '') {
      resolvedLat = parseFloat(manualLat);
      resolvedLng = parseFloat(manualLng);
    } else if (url && url.trim()) {
      const cleanUrl = url.trim();

      // Direct coordinates check (e.g. 13.4095, 101.0035)
      const coordMatch = cleanUrl.match(/^(-?[0-9]+\.[0-9]+)[,\s]+(-?[0-9]+\.[0-9]+)$/);
      if (coordMatch) {
        resolvedLat = parseFloat(coordMatch[1]);
        resolvedLng = parseFloat(coordMatch[2]);
      } else {
        const res = await fetch(cleanUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        const text = await res.text();
        const fullContent = res.url + ' ' + text;

        // 1. Look for encoded pattern: %213d(lat)%214d(lng) or !3d(lat)!4d(lng)
        const match3d4d = fullContent.match(/(?:!3d|%213d|%25213d)(-?[0-9]+(?:\.[0-9]+)?)(?:!4d|%214d|%25214d)(-?[0-9]+(?:\.[0-9]+)?)/i);
        if (match3d4d) {
          resolvedLat = parseFloat(match3d4d[1]);
          resolvedLng = parseFloat(match3d4d[2]);
        } else {
          // 2. Look for @lat,lng or %40lat,lng
          const matchAt = fullContent.match(/(?:@|%40)(-?[0-9]+\.[0-9]+),(-?[0-9]+\.[0-9]+)/);
          if (matchAt) {
            resolvedLat = parseFloat(matchAt[1]);
            resolvedLng = parseFloat(matchAt[2]);
          } else {
            // 3. Look for destination/q/ll params
            const matchQ = fullContent.match(/(?:destination|q|ll|query)=(-?[0-9]+\.[0-9]+)(?:,|%2C)(-?[0-9]+\.[0-9]+)/i);
            if (matchQ) {
              resolvedLat = parseFloat(matchQ[1]);
              resolvedLng = parseFloat(matchQ[2]);
            }
          }
        }
      }
    }

    if (!resolvedLat || !resolvedLng || isNaN(resolvedLat) || isNaN(resolvedLng)) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถดึงพิกัดจากลิงก์ Google Maps นี้ได้ กรุณาระบุพิกัด lat, lng โดยตรง' },
        { status: 400 }
      );
    }

    // Save to database
    if (lead_id || tax_id) {
      let whereClause = '';
      const values: any[] = [resolvedLat, resolvedLng];
      if (lead_id) {
        whereClause = 'id = $3';
        values.push(lead_id);
      } else {
        whereClause = 'tax_id = $3';
        values.push(tax_id);
      }

      if (pool) {
        try {
          await pool.query(
            `
            UPDATE public.target_factory_leads
            SET lat = $1, lng = $2, updated_at = NOW()
            WHERE ${whereClause}
          `,
            values
          );
        } catch (poolErr) {
          console.warn('Resolve map pool failed, fallback to Supabase:', poolErr);
        }
      }

      try {
        let sbQuery = supabase.from('target_factory_leads').update({
          lat: resolvedLat,
          lng: resolvedLng,
          updated_at: new Date().toISOString(),
        });
        if (lead_id) sbQuery = sbQuery.eq('id', lead_id);
        else sbQuery = sbQuery.eq('tax_id', tax_id);
        await sbQuery;
      } catch (sbErr) {
        console.warn('Resolve map Supabase fallback error:', sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      lat: resolvedLat,
      lng: resolvedLng,
    });
  } catch (err: any) {
    console.error('Resolve map error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
