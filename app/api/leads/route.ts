import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "leads"; // 'leads' or 'dbd'
    const province = searchParams.get("province");
    const district = searchParams.get("district");
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "1000", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (source === "dbd") {
      // Query from public.dbd_companies (371,350 clean companies)
      const conditions: string[] = ["1=1"];
      const values: any[] = [];
      let pIdx = 1;

      if (province && province !== "ALL") {
        conditions.push(`province ILIKE $${pIdx++}`);
        values.push(`%${province.replace(/^จ\./, '')}%`);
      }

      if (district && district !== "ALL") {
        conditions.push(`district ILIKE $${pIdx++}`);
        values.push(`%${district.replace(/^(อ\.|เขต)/, '')}%`);
      }

      if (query && query.trim()) {
        conditions.push(`(name ILIKE $${pIdx} OR objective ILIKE $${pIdx} OR tsic_code ILIKE $${pIdx} OR address ILIKE $${pIdx})`);
        values.push(`%${query.trim()}%`);
        pIdx++;
      }

      const offset = (page - 1) * limit;
      const sql = `
        SELECT 
          id,
          tax_id,
          tax_id as place_id,
          name,
          name as company_name,
          address,
          subdistrict,
          district,
          province,
          postal_code,
          registered_capital,
          tsic_code,
          objective,
          lat,
          lng,
          phone,
          website,
          'dbd' as source_type,
          created_at
        FROM public.dbd_companies
        WHERE ${conditions.join(" AND ")}
        ORDER BY registered_capital DESC
        LIMIT ${limit} OFFSET ${offset};
      `;

      const res = await pool.query(sql, values);

      return NextResponse.json({
        success: true,
        source: 'dbd',
        total: res.rows.length,
        leads: res.rows,
      });
    }

    // Default: Query from public.leads (989 Verified Factory Leads)
    const conditions: string[] = ["1=1"];
    const values: any[] = [];
    let pIdx = 1;

    if (province && province !== "ALL") {
      conditions.push(`province ILIKE $${pIdx++}`);
      values.push(`%${province.replace(/^จ\./, '')}%`);
    }

    if (district && district !== "ALL") {
      conditions.push(`district ILIKE $${pIdx++}`);
      values.push(`%${district.replace(/^(อ\.|เขต)/, '')}%`);
    }

    if (query && query.trim()) {
      conditions.push(`(name ILIKE $${pIdx} OR company_name ILIKE $${pIdx} OR address ILIKE $${pIdx} OR subdistrict ILIKE $${pIdx} OR district ILIKE $${pIdx})`);
      values.push(`%${query.trim()}%`);
      pIdx++;
    }

    const sql = `
      SELECT 
        id,
        place_id,
        name,
        company_name,
        address,
        road,
        district,
        subdistrict,
        province,
        postal_code,
        phone,
        website,
        email,
        lat,
        lng,
        maps_url,
        rating,
        user_ratings_total,
        'leads' as source_type,
        created_at
      FROM public.leads
      WHERE ${conditions.join(" AND ")}
      ORDER BY id ASC
      LIMIT ${limit};
    `;

    const res = await pool.query(sql, values);

    return NextResponse.json({
      success: true,
      source: 'leads',
      total: res.rows.length,
      leads: res.rows,
    });
  } catch (error: any) {
    console.error("Fetch leads error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
