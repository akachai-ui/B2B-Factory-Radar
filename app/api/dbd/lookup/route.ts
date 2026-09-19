import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taxId = searchParams.get('tax_id');
    const name = searchParams.get('name');

    if (!taxId && !name) {
      return NextResponse.json({ success: false, error: 'Missing tax_id or name parameter' }, { status: 400 });
    }

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

      // Strategy 1: Exact Clean Core Substring Match (e.g. "ทรัพย์กังวาล", "ยูนิคพลาสติก อินดัสตรี")
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

      // If cleanCore is short or no query set yet, fallback to raw name match
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

    // Strategy 2: If no exact match and cleanCore has multiple significant words, try distinct keywords (excluding stop words)
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

    if (res.rows.length === 0) {
      return NextResponse.json({ success: true, found: false, data: null });
    }

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
  } catch (err: any) {
    console.error('DBD Lookup error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
