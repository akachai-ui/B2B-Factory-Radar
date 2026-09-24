import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taxId = searchParams.get('tax_id');
    const name = searchParams.get('name');

    if (!taxId && !name) {
      return NextResponse.json({ success: false, error: 'Missing tax_id or name parameter' }, { status: 400 });
    }

    if (pool) {
      try {
        let query = '';
        const values: any[] = [];

        if (taxId && taxId.trim()) {
          query = `
            SELECT 
              id,
              tax_id,
              name as company_name,
              registered_capital,
              tsic_code,
              objective,
              address,
              subdistrict,
              district,
              province,
              postal_code,
              status,
              registration_date,
              lat,
              lng
            FROM public.dbd_companies
            WHERE tax_id = $1
            LIMIT 1;
          `;
          values.push(taxId.trim());
        } else if (name && name.trim()) {
          const cleanCore = name.trim()
            .replace(/^[A-Z0-9\s\-]+-\s*/i, '') // Remove brand prefixes like "SCMP - "
            .replace(/^(บจก\.|บริษัท|หจก\.|ห้างหุ้นส่วนจำกัด)\s*/i, '')
            .replace(/\s*(จำกัด|จำกัด\s*\(มหาชน\)|\(ประเทศไทย\)|\(ไทยแลนด์\))\s*$/ig, '')
            .replace(/\s*\(.*?\)\s*/g, '') // remove parentheses text
            .trim();

          // Strategy 1: Exact Clean Core Substring Match
          if (cleanCore.length >= 3) {
            query = `
              SELECT 
                id,
                tax_id,
                name as company_name,
                registered_capital,
                tsic_code,
                objective,
                address,
                subdistrict,
                district,
                province,
                postal_code,
                status,
                registration_date,
                lat,
                lng
              FROM public.dbd_companies
              WHERE name ILIKE $1
              ORDER BY registered_capital DESC
              LIMIT 1;
            `;
            values.push(`%${cleanCore}%`);
          }

          if (!query) {
            query = `
              SELECT 
                id,
                tax_id,
                name as company_name,
                registered_capital,
                tsic_code,
                objective,
                address,
                subdistrict,
                district,
                province,
                postal_code,
                status,
                registration_date,
                lat,
                lng
              FROM public.dbd_companies
              WHERE name ILIKE $1
              LIMIT 1;
            `;
            values.push(`%${name.trim()}%`);
          }
        }

        let res = await pool.query(query, values);

        if (res.rows.length === 0 && name && name.trim()) {
          const stopWords = new Set(['อุตสาหกรรม', 'พลาสติก', 'กรุ๊ป', 'อินเตอร์เนชั่นแนล', 'เทคโนโลยี', 'จำกัด', 'การค้า', 'ไทย', 'สยาม', 'ซัพพลาย', 'แอนด์', 'โปรดักส์', 'แพ็คกิ้ง', 'บรรจุภัณฑ์', 'โรงงาน']);
          const cleanCore = name.trim()
            .replace(/^[A-Z0-9\s\-]+-\s*/i, '')
            .replace(/^(บจก\.|บริษัท|หจก\.|ห้างหุ้นส่วนจำกัด)\s*/i, '')
            .replace(/\s*(จำกัด|จำกัด\s*\(มหาชน\)|\(ประเทศไทย\)|\(ไทยแลนด์\))\s*$/ig, '')
            .trim();

          const words = cleanCore.split(/\s+/).filter((w) => w.length >= 3 && !stopWords.has(w));
          if (words.length >= 1) {
            const conds = words.map((w, idx) => `name ILIKE $${idx + 1}`);
            const fallbackQuery = `
              SELECT 
                id,
                tax_id,
                name as company_name,
                registered_capital,
                tsic_code,
                objective,
                address,
                subdistrict,
                district,
                province,
                postal_code,
                status,
                registration_date,
                lat,
                lng
              FROM public.dbd_companies
              WHERE ${conds.join(' AND ')}
              ORDER BY registered_capital DESC
              LIMIT 1;
            `;
            res = await pool.query(fallbackQuery, words.map((w) => `%${w}%`));
          }
        }

        if (res.rows.length > 0) {
          const company = res.rows[0];
          const capital = Number(company.registered_capital || 0);

          let capitalTier = 'SME';
          if (capital >= 50000000) capitalTier = 'ENTERPRISE';
          else if (capital >= 20000000) capitalTier = 'LARGE';
          else if (capital >= 5000000) capitalTier = 'MID';

          return NextResponse.json({
            success: true,
            found: true,
            data: {
              ...company,
              capital_tier: capitalTier,
            },
          });
        }
      } catch (poolErr) {
        console.warn('DBD Lookup pool query failed, fallback to Supabase:', poolErr);
      }
    }

    // Supabase fallback
    let sb = supabase.from('dbd_companies').select('*');
    if (taxId && taxId.trim()) {
      sb = sb.eq('tax_id', taxId.trim()).limit(1);
    } else if (name && name.trim()) {
      const cleanCore = name.trim()
        .replace(/^[A-Z0-9\s\-]+-\s*/i, '')
        .replace(/^(บจก\.|บริษัท|หจก\.|ห้างหุ้นส่วนจำกัด)\s*/i, '')
        .replace(/\s*(จำกัด|จำกัด\s*\(มหาชน\)|\(ประเทศไทย\)|\(ไทยแลนด์\))\s*$/ig, '')
        .trim();
      sb = sb.ilike('name', `%${cleanCore || name.trim()}%`).limit(1);
    }

    const { data: sbCompanies } = await sb;
    if (!sbCompanies || sbCompanies.length === 0) {
      return NextResponse.json({ success: true, found: false, data: null });
    }

    const company = sbCompanies[0];
    const capital = Number(company.registered_capital || 0);

    let capitalTier = 'SME';
    if (capital >= 50000000) capitalTier = 'ENTERPRISE';
    else if (capital >= 20000000) capitalTier = 'LARGE';
    else if (capital >= 5000000) capitalTier = 'MID';

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        ...company,
        company_name: company.name,
        capital_tier: capitalTier,
      },
    });
  } catch (err: any) {
    console.error('DBD Lookup error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
