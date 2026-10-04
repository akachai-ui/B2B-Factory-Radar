import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { supabase } from "@/lib/supabase";

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
      if (pool) {
        try {
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
              id, tax_id, tax_id as place_id, name, name as company_name,
              address, subdistrict, district, province, postal_code,
              registered_capital, tsic_code, objective, lat, lng,
              phone, website, 'dbd' as source_type, created_at
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
        } catch (dbdErr) {
          console.warn("DBD pool query failed, falling back to verified leads:", dbdErr);
        }
      }
    }

    // Default: Query from public.factory_leads (Industrial Factory Leads)
    if (pool) {
      try {
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
          conditions.push(`(name ILIKE $${pIdx} OR company_name ILIKE $${pIdx} OR address ILIKE $${pIdx} OR subdistrict ILIKE $${pIdx} OR district ILIKE $${pIdx} OR notes ILIKE $${pIdx})`);
          values.push(`%${query.trim()}%`);
          pIdx++;
        }

        const sql = `
          SELECT 
            id, place_id, name, company_name, address, district,
            subdistrict, province, phone, website, email,
            lat, lng, maps_url, status, sales_rep, contact_person, notes,
            'leads' as source_type, created_at, updated_at
          FROM public.factory_leads
          WHERE ${conditions.join(" AND ")}
          ORDER BY id ASC
          LIMIT ${limit};
        `;

        const res = await pool.query(sql, values);
        if (res.rows.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'factory_leads',
            total: res.rows.length,
            leads: res.rows,
          });
        }
      } catch (poolErr) {
        console.warn("Factory leads pool query failed, falling back to Supabase client:", poolErr);
      }
    }

    // Supabase REST Client fallback (Guaranteed to work on Cloud / Vercel!)
    let sb = supabase.from('factory_leads').select('*').limit(limit);
    if (province && province !== 'ALL') {
      sb = sb.ilike('province', `%${province.replace(/^จ\./, '')}%`);
    }
    if (district && district !== 'ALL') {
      sb = sb.ilike('district', `%${district.replace(/^(อ\.|เขต)/, '')}%`);
    }
    if (query && query.trim()) {
      sb = sb.or(`name.ilike.%${query.trim()}%,company_name.ilike.%${query.trim()}%,address.ilike.%${query.trim()}%,notes.ilike.%${query.trim()}%`);
    }

    const { data, error } = await sb;
    if (error) {
      // Fallback to leads table if factory_leads is unavailable
      const { data: fallbackLeads, error: fbErr } = await supabase.from('leads').select('*').limit(limit);
      if (fbErr) throw error;
      return NextResponse.json({
        success: true,
        source: 'leads',
        total: fallbackLeads?.length || 0,
        leads: (fallbackLeads || []).map((l) => ({ ...l, source_type: 'leads' })),
      });
    }

    return NextResponse.json({
      success: true,
      source: 'factory_leads',
      total: data?.length || 0,
      leads: (data || []).map((l) => ({ ...l, source_type: 'leads' })),
    });
  } catch (error: any) {
    console.error("Fetch factory leads error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
