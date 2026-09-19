import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      company_id,
      user_id,
      source_type = 'dbd',
      dbd_id = null,
      lead_id = null,
      place_id = null,
      company_name,
      tax_id = null,
      registered_capital = 0,
      tsic_code = null,
      objective = null,
      address = null,
      subdistrict = null,
      district = null,
      province = null,
      postal_code = null,
      lat = null,
      lng = null,
      phone = null,
      email = null,
      website = null,
      notes = null,
    } = body;

    if (!company_id || !user_id || !company_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (company_id, user_id, company_name)' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 1. Check if already claimed in this company
      if (dbd_id) {
        const checkRes = await client.query(
          `SELECT cl.id, cl.user_id, p.full_name as claimed_by_name 
           FROM public.company_leads cl
           LEFT JOIN public.profiles p ON cl.user_id = p.id
           WHERE cl.company_id = $1 AND cl.dbd_id = $2;`,
          [company_id, dbd_id]
        );
        if (checkRes.rows.length > 0) {
          const existing = checkRes.rows[0];
          if (existing.user_id) {
            return NextResponse.json({
              success: false,
              already_claimed: true,
              claimed_by_name: existing.claimed_by_name || 'เพื่อนในทีม',
              is_own_claim: existing.user_id === user_id,
              message: `บริษัทนี้อยู่ในพอร์ตของ ${existing.claimed_by_name || 'ทีมคุณ'} เรียบร้อยแล้ว`,
            });
          } else {
            // It was in Unassigned Pool -> Assign to this user now
            const updateRes = await client.query(
              `UPDATE public.company_leads 
               SET user_id = $1, claimed_by = $1, updated_at = NOW(), last_activity_at = NOW()
               WHERE id = $2 RETURNING *;`,
              [user_id, existing.id]
            );
            await client.query(
              `INSERT INTO public.lead_activities (company_id, company_lead_id, user_id, activity_type, content)
               VALUES ($1, $2, $3, 'NOTE', $4);`,
              [company_id, existing.id, user_id, '📥 เซลส์หยิบลูกค้ารายนี้จากคลังกลางเข้าสู่พอร์ตตนเอง']
            );
            return NextResponse.json({
              success: true,
              lead: updateRes.rows[0],
              message: 'ดึงลูกค้าจากคลังกลางเข้าสู่พอร์ตของคุณเรียบร้อยแล้ว',
            });
          }
        }
      }

      if (lead_id) {
        const checkRes = await client.query(
          `SELECT cl.id, cl.user_id, p.full_name as claimed_by_name 
           FROM public.company_leads cl
           LEFT JOIN public.profiles p ON cl.user_id = p.id
           WHERE cl.company_id = $1 AND cl.lead_id = $2;`,
          [company_id, lead_id]
        );
        if (checkRes.rows.length > 0) {
          const existing = checkRes.rows[0];
          if (existing.user_id) {
            return NextResponse.json({
              success: false,
              already_claimed: true,
              claimed_by_name: existing.claimed_by_name || 'เพื่อนในทีม',
              is_own_claim: existing.user_id === user_id,
              message: `โรงงานนี้อยู่ในพอร์ตของ ${existing.claimed_by_name || 'ทีมคุณ'} เรียบร้อยแล้ว`,
            });
          } else {
            // It was in Unassigned Pool -> Assign to this user now
            const updateRes = await client.query(
              `UPDATE public.company_leads 
               SET user_id = $1, claimed_by = $1, updated_at = NOW(), last_activity_at = NOW()
               WHERE id = $2 RETURNING *;`,
              [user_id, existing.id]
            );
            await client.query(
              `INSERT INTO public.lead_activities (company_id, company_lead_id, user_id, activity_type, content)
               VALUES ($1, $2, $3, 'NOTE', $4);`,
              [company_id, existing.id, user_id, '📥 เซลส์หยิบลูกค้ารายนี้จากคลังกลางเข้าสู่พอร์ตตนเอง']
            );
            return NextResponse.json({
              success: true,
              lead: updateRes.rows[0],
              message: 'ดึงลูกค้าจากคลังกลางเข้าสู่พอร์ตของคุณเรียบร้อยแล้ว',
            });
          }
        }
      }

      // 2. Insert into company_leads
      const insertQuery = `
        INSERT INTO public.company_leads (
          company_id,
          user_id,
          claimed_by,
          source_type,
          dbd_id,
          lead_id,
          place_id,
          company_name,
          tax_id,
          registered_capital,
          tsic_code,
          objective,
          address,
          subdistrict,
          district,
          province,
          postal_code,
          lat,
          lng,
          phone,
          email,
          website,
          notes,
          status,
          priority,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'NEW', 'MEDIUM', NOW(), NOW()
        )
        RETURNING *;
      `;

      const values = [
        company_id,
        user_id,
        source_type,
        dbd_id,
        lead_id,
        place_id,
        company_name,
        tax_id,
        registered_capital,
        tsic_code,
        objective,
        address,
        subdistrict,
        district,
        province,
        postal_code,
        lat,
        lng,
        phone,
        email,
        website,
        notes,
      ];

      const insertRes = await client.query(insertQuery, values);
      const newLead = insertRes.rows[0];

      return NextResponse.json({
        success: true,
        message: `หยิบ "${company_name}" เข้าสู่พอร์ตของคุณเรียบร้อยแล้ว!`,
        lead: newLead,
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error claiming lead:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
