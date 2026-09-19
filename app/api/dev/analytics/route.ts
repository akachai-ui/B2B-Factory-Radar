import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const MATCHING_RULES: Record<string, {
  name: string;
  icon: string;
  buyers: { tsics: string[]; label: string; reason: string }[];
  suppliers: { tsics: string[]; label: string; reason: string }[];
  logistics: { tsics: string[]; label: string; reason: string }[];
}> = {
  FOOD: {
    name: 'โรงงานอาหาร & เครื่องดื่ม',
    icon: '🍞',
    buyers: [
      { tsics: ['4631', '4632'], label: 'ร้านค้าส่งอาหาร & วัตถุดิบ (Wholesale Food)', reason: 'กระจายสินค้าเข้าสู่ตลาดและห้างร้าน' },
      { tsics: ['5510', '5610'], label: 'โรงแรม รีสอร์ท & ภัตตาคาร (HORECA)', reason: 'สั่งซื้อวัตถุดิบอาหารและเครื่องดื่มปรุงสด' },
      { tsics: ['4690'], label: 'ตัวแทนส่งออก & เทรดดิ้งระหว่างประเทศ', reason: 'นำสินค้าอาหารไทยส่งออกต่างประเทศ' },
      { tsics: ['4711', '4719'], label: 'ห้างค้าปลีก ซูเปอร์มาร์เก็ต & มินิมาร์ท', reason: 'วางจำหน่ายสินค้าบนชั้นวางทั่วประเทศ' },
    ],
    suppliers: [
      { tsics: ['1702', '1811', '2220'], label: 'โรงงานกล่อง บรรจุภัณฑ์ & ฉลากสินค้า', reason: 'ป้อนกล่องลูกฟูก ซองฟอยล์ และฉลาก อย.' },
      { tsics: ['2011', '2029', '1061'], label: 'เคมีอาหาร สารปรุงแต่ง & แป้งดัดแปร', reason: 'ป้อนสารแต่งกลิ่น/รส สารกันบูด และวัตถุดิบแปรรูป' },
      { tsics: ['2821', '2819'], label: 'เครื่องจักรแปรรูปอาหาร & ปั๊มสแตนเลส', reason: 'เครื่องล้าง ผสม บรรจุ และระบบทำความเย็น' },
      { tsics: ['0111', '0141'], label: 'ฟาร์มเกษตร & ปศุสัตว์', reason: 'ป้อนผลผลิตทางการเกษตรและเนื้อสัตว์สด' },
    ],
    logistics: [
      { tsics: ['4932'], label: 'รถบรรทุกขนส่งห้องเย็น (Cold Chain Transport)', reason: 'ขนส่งควบคุมอุณหภูมิ 0-4°C หรือ -18°C' },
      { tsics: ['5210'], label: 'คลังสินค้าแช่แข็ง-แช่เย็น (Cold Storage)', reason: 'รับฝากเก็บสต็อกอาหารสดและอาหารแช่แข็ง' },
    ],
  },
  PACKAGING: {
    name: 'โรงงานบรรจุภัณฑ์ & สิ่งพิมพ์',
    icon: '📦',
    buyers: [
      { tsics: ['1011', '1020', '1030', '1071', '1079'], label: 'โรงงานอาหาร & เครื่องดื่ม (5,743 แห่ง)', reason: 'สั่งซื้อกล่อง ถุงฟอยล์ และซองสุญญากาศทุกวัน' },
      { tsics: ['2023', '2100'], label: 'โรงงานเครื่องสำอาง สบู่ & ยารักษาโรค', reason: 'สั่งซื้อขวด ตลับ ฉลากฟอยล์ และกล่องพรีเมียม' },
      { tsics: ['3100', '2640'], label: 'โรงงานผลิตเฟอร์นิเจอร์ & เครื่องใช้ไฟฟ้า', reason: 'สั่งซื้อกล่องลูกฟูกขนาดใหญ่และโฟมกันกระแทก' },
      { tsics: ['4791', '5320'], label: 'ธุรกิจ E-commerce & คลังสินค้าออนไลน์', reason: 'สั่งซื้อกล่องพัสดุ เทปกาว และซองกันกระแทก' },
    ],
    suppliers: [
      { tsics: ['1701'], label: 'โรงงานเยื่อกระดาษ & กระดาษคราฟท์', reason: 'ป้อนม้วนกระดาษทำลูกฟูก' },
      { tsics: ['2011', '2022'], label: 'โรงงานหมึกพิมพ์ & กาวอุตสาหกรรม', reason: 'หมึกพิมพ์ระบบ Flexo/Offset และกาวติดกล่อง' },
      { tsics: ['2829', '2819'], label: 'เครื่องพิมพ์ & เครื่องตัดพับกล่อง', reason: 'ซ่อมบำรุงและอัปเกรดเครื่องจักรผลิตกล่อง' },
    ],
    logistics: [
      { tsics: ['4932'], label: 'รถบรรทุก 6 ล้อ / 10 ล้อตู้ทึบ', reason: 'ขนส่งกล่องพาเลทไปส่งหน้าโรงงานลูกค้า' },
    ],
  },
  METALS: {
    name: 'โรงงานโลหะ & งานแปรรูปโครงสร้าง',
    icon: '⚙️',
    buyers: [
      { tsics: ['4100', '4210', '4220'], label: 'ผู้รับเหมาก่อสร้าง & งานโยธา (41,474 แห่ง)', reason: 'สั่งซื้อโครงสร้างเหล็ก เสา ท่อ และเหล็กรูปพรรณ' },
      { tsics: ['2930', '2910'], label: 'โรงงานผลิตชิ้นส่วนยานยนต์ & ตัวถังรถ', reason: 'ปั๊มขึ้นรูปและกลึงชิ้นส่วนรถยนต์ตามแบบ' },
      { tsics: ['2822', '2829'], label: 'โรงงานผลิตเครื่องจักรอุตสาหกรรม', reason: 'สั่งผลิตเฟือง เพลา โครงเครื่องจักร OEM' },
      { tsics: ['3100'], label: 'โรงงานผลิตเฟอร์นิเจอร์โลหะ', reason: 'สั่งตัด ดัด พับ ขาโต๊ะและโครงเหล็ก' },
    ],
    suppliers: [
      { tsics: ['2410', '2420'], label: 'โรงงานถลุงเหล็ก & โลหะขั้นมูลฐาน', reason: 'ป้อนเหล็กแท่ง เหล็กแผ่นรีดร้อน/เย็น' },
      { tsics: ['2011'], label: 'ก๊าซอุตสาหกรรม (ออกซิเจน/อาร์กอน/ไนโตรเจน)', reason: 'ใช้สำหรับงานเชื่อมและตัดเลเซอร์' },
      { tsics: ['2822'], label: 'เครื่องตัดไฟเบอร์เลเซอร์ & CNC', reason: 'เครื่องมือกลความละเอียดสูง' },
    ],
    logistics: [
      { tsics: ['4932'], label: 'รถเทรลเลอร์ & รถเครนรับจ้าง', reason: 'ขนส่งเหล็กหนักและชิ้นงานขนาดใหญ่' },
    ],
  },
  PLASTICS: {
    name: 'โรงงานพลาสติก & ยาง',
    icon: '🧴',
    buyers: [
      { tsics: ['1079', '1104'], label: 'โรงงานอาหาร & น้ำดื่ม', reason: 'สั่งซื้อขวด PET หลอด ฝาพลาสติก' },
      { tsics: ['2023'], label: 'โรงงานเครื่องสำอาง & ของใช้ส่วนตัว', reason: 'สั่งซื้อบรรจุภัณฑ์กระปุก ตลับ และหัวปั๊ม' },
      { tsics: ['2930'], label: 'โรงงานชิ้นส่วนรถยนต์', reason: 'สั่งฉีดขึ้นรูปกันชน คอนโซล และกิ๊ฟล็อค' },
      { tsics: ['2710', '2790'], label: 'โรงงานเครื่องใช้ไฟฟ้า', reason: 'กรอบพลาสติก ฉนวน และชิ้นส่วนปลั๊ก' },
    ],
    suppliers: [
      { tsics: ['2013'], label: 'โรงงานปิโตรเคมี & เม็ดพลาสติก (PP/PE/PET/ABS)', reason: 'ป้อนวัตถุดิบเม็ดพลาสติกหลากเกรด' },
      { tsics: ['2822', '2591'], label: 'โรงงานผลิตแม่พิมพ์ (Mould & Die)', reason: 'สั่งทำแม่พิมพ์ฉีด/เป่าพลาสติกตามสั่ง' },
      { tsics: ['2022'], label: 'สารเติมแต่งพลาสติก & แม่สี (Masterbatch)', reason: 'ผสมสีและเพิ่มคุณสมบัติทนความร้อน' },
    ],
    logistics: [
      { tsics: ['4932'], label: 'รถขนส่งสินค้าแห้งทั่วไป', reason: 'ส่งมอบชิ้นงานบรรจุลังเข้าไลน์ผลิตลูกค้า' },
    ],
  },
  CONSTRUCTION: {
    name: 'ผู้รับเหมาก่อสร้าง & งานระบบ',
    icon: '🏗️',
    buyers: [
      { tsics: ['6810', '6820'], label: 'เจ้าของโครงการอสังหาฯ & นิคมอุตสาหกรรม', reason: 'ว่าจ้างสร้างโครงการ หมู่บ้าน โกดัง และโรงงาน' },
      { tsics: ['1000', '2000', '3000'], label: 'โรงงานอุตสาหกรรมทุกประเภท', reason: 'ว่าจ้างต่อเติมโรงงาน ปรับปรุงไลน์ผลิต และงานระบบ' },
      { tsics: ['8411', '8510'], label: 'หน่วยงานราชการ & สถาบันการศึกษา', reason: 'ประมูลงานก่อสร้างภาครัฐและสาธารณูปโภค' },
    ],
    suppliers: [
      { tsics: ['2395'], label: 'โรงงานคอนกรีตผสมเสร็จ & เสาเข็ม (Ready-Mix)', reason: 'เทคอนกรีตฐานรากและโครงสร้าง' },
      { tsics: ['2410', '2511'], label: 'ร้านค้าส่งเหล็กเส้น & โครงสร้างเหล็ก', reason: 'เหล็กข้ออ้อย เหล็กรูปพรรณสำหรับงานโครงสร้าง' },
      { tsics: ['2732', '4322'], label: 'ตัวแทนจำหน่ายสายไฟ ท่อร้อยสาย & แอร์', reason: 'งานระบบไฟฟ้า M&E สุขาภิบาล และดับเพลิง' },
    ],
    logistics: [
      { tsics: ['4932'], label: 'รถโม่ปูน & รถสิบล้อดั๊มพ์', reason: 'ขนส่งหิน ดิน ทราย และคอนกรีตเข้าไซต์งาน' },
    ],
  },
  LOGISTICS: {
    name: 'ผู้ให้บริการขนส่ง & คลังสินค้า',
    icon: '🚚',
    buyers: [
      { tsics: ['4600', '4690'], label: 'ธุรกิจค้าส่ง B2B & เทรดดิ้ง (114,653 แห่ง)', reason: 'ว่าจ้างกระจายสินค้าและจัดเก็บสต็อก' },
      { tsics: ['1000', '2000'], label: 'โรงงานอาหาร เคมีภัณฑ์ & เครื่องสำอาง', reason: 'ว่าจ้างรับส่งวัตถุดิบและส่งสินค้าสำเร็จรูป' },
      { tsics: ['4791'], label: 'แพลตฟอร์ม E-Commerce & แบรนด์ออนไลน์', reason: 'บริการ Fulfilment แพ็คและส่งด่วน' },
    ],
    suppliers: [
      { tsics: ['4510'], label: 'ตัวแทนจำหน่ายรถบรรทุก & รถหัวลาก', reason: 'จัดซื้อรถขนส่งเพิ่มขยายฟลีต' },
      { tsics: ['4661'], label: 'ผู้ค้าน้ำมันเชื้อเพลิง & ก๊าซ NGV/LPG', reason: 'เติมน้ำมันและทำสัญญาส่วนลดฟลีตการ์ด' },
      { tsics: ['2211'], label: 'โรงงานยางรถยนต์ & อะไหล่รถบรรทุก', reason: 'เปลี่ยนยางและบำรุงรักษาตามรอบระยะทาง' },
    ],
    logistics: [
      { tsics: ['5229'], label: 'ตัวแทนชิปปิ้ง & ด่านศุลกากร', reason: 'ประสานงานเคลียร์สินค้าส่งออก-นำเข้า' },
    ],
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'summary';
    const industryKey = searchParams.get('industry') || 'FOOD';
    const matchType = searchParams.get('match_type') || 'BUYERS'; // BUYERS, SUPPLIERS, LOGISTICS
    const tsic2Digit = searchParams.get('tsic_2digit') || 'ALL';
    const tsicCode = searchParams.get('tsic_code') || 'ALL';
    const capitalTier = searchParams.get('tier') || 'ALL';
    const province = searchParams.get('province') || 'ALL';
    const queryStr = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // MODE: Partner Matchmaking Engine
    if (mode === 'matching') {
      const selectedRule = MATCHING_RULES[industryKey] || MATCHING_RULES.FOOD;
      let targetSegments = selectedRule.buyers;
      if (matchType === 'SUPPLIERS') targetSegments = selectedRule.suppliers;
      if (matchType === 'LOGISTICS') targetSegments = selectedRule.logistics;

      // Extract all TSIC prefixes from target segments
      const allTsicPrefixes = targetSegments.flatMap((seg) => seg.tsics);

      const values: any[] = [];
      let pIdx = 1;

      const tsicOrParts = allTsicPrefixes.map((p) => {
        values.push(`${p}%`);
        return `tsic_code LIKE $${pIdx++}`;
      });

      let provinceCond = '';
      if (province && province !== 'ALL') {
        values.push(province);
        provinceCond = `AND province = $${pIdx++}`;
      }

      const query = `
        SELECT id, name as company_name, tax_id, registered_capital, tsic_code, objective, address, subdistrict, district, province, lat, lng
        FROM public.dbd_companies
        WHERE (${tsicOrParts.length > 0 ? tsicOrParts.join(' OR ') : '1=1'})
        ${provinceCond}
        ORDER BY registered_capital DESC
        LIMIT 30;
      `;

      const res = await pool.query(query, values);

      return NextResponse.json({
        success: true,
        industry_info: selectedRule,
        match_type: matchType,
        target_segments: targetSegments,
        matched_companies: res.rows,
        total_found: res.rows.length,
      });
    }

    // MODE: Prospects 46693 (Your Target Clients to Sell To)
    if (mode === 'prospects_46693') {
      const conditions: string[] = ["tsic_code LIKE '46693%'"];
      const values: any[] = [];
      let pIdx = 1;

      if (province && province !== 'ALL') {
        conditions.push(`province = $${pIdx++}`);
        values.push(province);
      }

      if (capitalTier === 'ENTERPRISE') {
        conditions.push(`registered_capital >= 50000000`);
      } else if (capitalTier === 'LARGE') {
        conditions.push(`registered_capital BETWEEN 20000000 AND 49999999`);
      } else if (capitalTier === 'MID') {
        conditions.push(`registered_capital BETWEEN 5000000 AND 19999999`);
      } else if (capitalTier === 'SME') {
        conditions.push(`registered_capital < 5000000`);
      }

      if (queryStr.trim()) {
        conditions.push(`(name ILIKE $${pIdx} OR objective ILIKE $${pIdx} OR province ILIKE $${pIdx})`);
        values.push(`%${queryStr.trim()}%`);
        pIdx++;
      }

      const offset = (page - 1) * limit;
      const listQuery = `
        SELECT id, name as company_name, tax_id, registered_capital, tsic_code, objective, address, subdistrict, district, province, lat, lng
        FROM public.dbd_companies
        WHERE ${conditions.join(' AND ')}
        ORDER BY registered_capital DESC
        LIMIT ${limit} OFFSET ${offset};
      `;

      const countQuery = `
        SELECT 
          count(*) as total,
          round(avg(registered_capital)) as avg_capital,
          sum(case when registered_capital >= 50000000 then 1 else 0 end) as enterprise_count,
          sum(case when registered_capital between 20000000 and 49999999 then 1 else 0 end) as large_count,
          sum(case when registered_capital between 5000000 and 19999999 then 1 else 0 end) as mid_count,
          sum(case when registered_capital < 5000000 then 1 else 0 end) as sme_count
        FROM public.dbd_companies
        WHERE ${conditions.join(' AND ')};
      `;

      const [itemsRes, statsRes] = await Promise.all([
        pool.query(listQuery, values),
        pool.query(countQuery, values),
      ]);

      return NextResponse.json({
        success: true,
        total: parseInt(statsRes.rows[0].total, 10),
        stats: statsRes.rows[0],
        page,
        limit,
        items: itemsRes.rows,
      });
    }

    // MODE: Target Factory Leads Pool (Extracted Factory Buyers)
    if (mode === 'target_leads') {
      const cluster = searchParams.get('cluster') || 'ALL';
      const conditions: string[] = ['1=1'];
      const values: any[] = [];
      let pIdx = 1;

      if (cluster !== 'ALL') {
        conditions.push(`industry_cluster = $${pIdx++}`);
        values.push(cluster);
      }

      if (tsicCode !== 'ALL' && tsicCode.trim()) {
        conditions.push(`tsic_code LIKE $${pIdx++}`);
        values.push(`${tsicCode.trim()}%`);
      }

      if (province && province !== 'ALL') {
        conditions.push(`province = $${pIdx++}`);
        values.push(province);
      }

      if (capitalTier === 'ENTERPRISE') {
        conditions.push(`registered_capital >= 50000000`);
      } else if (capitalTier === 'LARGE') {
        conditions.push(`registered_capital BETWEEN 20000000 AND 49999999`);
      } else if (capitalTier === 'MID') {
        conditions.push(`registered_capital BETWEEN 5000000 AND 19999999`);
      } else if (capitalTier === 'SME') {
        conditions.push(`registered_capital < 5000000`);
      }

      if (queryStr.trim()) {
        conditions.push(`(company_name ILIKE $${pIdx} OR objective ILIKE $${pIdx} OR raw_materials_needed ILIKE $${pIdx} OR target_group_label ILIKE $${pIdx})`);
        values.push(`%${queryStr.trim()}%`);
        pIdx++;
      }

      const offset = (page - 1) * limit;
      const listQuery = `
        SELECT id, tax_id, company_name, industry_cluster, target_group_label, tsic_code, objective, registered_capital, capital_tier, raw_materials_needed, address, subdistrict, district, province, lat, lng, phone, email, lead_status
        FROM public.target_factory_leads
        WHERE ${conditions.join(' AND ')}
        ORDER BY registered_capital DESC
        LIMIT ${limit} OFFSET ${offset};
      `;

      const countQuery = `
        SELECT count(*) as total
        FROM public.target_factory_leads
        WHERE ${conditions.join(' AND ')};
      `;

      const clustersSummaryQuery = `
        SELECT industry_cluster, target_group_label, count(*) as count, round(avg(registered_capital)) as avg_capital
        FROM public.target_factory_leads
        GROUP BY industry_cluster, target_group_label
        ORDER BY count DESC;
      `;

      const [itemsRes, totalRes, clusterStatsRes] = await Promise.all([
        pool.query(listQuery, values),
        pool.query(countQuery, values),
        pool.query(clustersSummaryQuery),
      ]);

      return NextResponse.json({
        success: true,
        total: parseInt(totalRes.rows[0].total, 10),
        page,
        limit,
        cluster_stats: clusterStatsRes.rows,
        items: itemsRes.rows,
      });
    }

    // MODE: TSIC Tree & Taxonomy Data
    if (mode === 'tsic_tree') {
      const divisionRes = await pool.query(`
        SELECT 
          substring(tsic_code from 1 for 2) as code_2digit,
          count(*) as count,
          round(avg(registered_capital)) as avg_capital
        FROM public.dbd_companies
        WHERE substring(tsic_code from 1 for 2) ~ '^[0-9]+$'
        GROUP BY code_2digit
        ORDER BY count DESC;
      `);

      const subcodesRes = await pool.query(`
        SELECT 
          substring(tsic_code from 1 for 2) as parent_2digit,
          tsic_code,
          (array_agg(objective ORDER BY length(objective) ASC))[1] as objective,
          count(*) as count
        FROM public.dbd_companies
        WHERE tsic_code ~ '^[0-9]{4,5}$'
        GROUP BY parent_2digit, tsic_code
        ORDER BY count DESC
        LIMIT 500;
      `);

      return NextResponse.json({
        success: true,
        divisions: divisionRes.rows,
        subcodes: subcodesRes.rows,
      });
    }

    if (mode === 'summary') {
      const sectorRes = await pool.query(`
        SELECT 
          CASE 
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 10 AND 33 THEN 'MANUFACTURING'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 41 AND 43 THEN 'CONSTRUCTION'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 46 AND 47 THEN 'WHOLESALE_TRADING'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 49 AND 53 THEN 'LOGISTICS_SUPPLYCHAIN'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 55 AND 56 THEN 'HOSPITALITY_FOOD'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 58 AND 63 THEN 'IT_TECH'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 64 AND 66 THEN 'FINANCE_INSURANCE'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 68 AND 68 THEN 'REAL_ESTATE'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 69 AND 75 THEN 'PROFESSIONAL_SERVICES'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 77 AND 82 THEN 'BUSINESS_SUPPORT'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 85 AND 88 THEN 'HEALTHCARE_EDU'
            WHEN substring(tsic_code from 1 for 2)::int BETWEEN 01 AND 03 THEN 'AGRICULTURE'
            ELSE 'OTHER'
          END as cluster_key,
          count(*) as total,
          round(avg(registered_capital)) as avg_capital,
          sum(case when registered_capital >= 50000000 then 1 else 0 end) as tier_enterprise,
          sum(case when registered_capital between 20000000 and 49999999 then 1 else 0 end) as tier_large,
          sum(case when registered_capital between 5000000 and 19999999 then 1 else 0 end) as tier_mid,
          sum(case when registered_capital < 5000000 then 1 else 0 end) as tier_sme
        FROM public.dbd_companies
        WHERE tsic_code ~ '^[0-9]+$'
        GROUP BY cluster_key
        ORDER BY total DESC;
      `);

      const mfgRes = await pool.query(`
        SELECT 
          CASE 
            WHEN substring(tsic_code from 1 for 2)::int = 10 THEN 'FOOD_BEVERAGE'
            WHEN substring(tsic_code from 1 for 2)::int IN (13,14,15) THEN 'TEXTILES_APPAREL'
            WHEN substring(tsic_code from 1 for 2)::int IN (16,17,18) THEN 'PAPER_PACKAGING'
            WHEN substring(tsic_code from 1 for 2)::int IN (20,21) THEN 'CHEMICALS_PHARMA'
            WHEN substring(tsic_code from 1 for 2)::int = 22 THEN 'RUBBER_PLASTICS'
            WHEN substring(tsic_code from 1 for 2)::int = 23 THEN 'NON_METALLIC_GLASS'
            WHEN substring(tsic_code from 1 for 2)::int IN (24,25) THEN 'METALS_FABRICATION'
            WHEN substring(tsic_code from 1 for 2)::int IN (26,27) THEN 'ELECTRONICS_ELECTRICAL'
            WHEN substring(tsic_code from 1 for 2)::int = 28 THEN 'MACHINERY_EQUIPMENT'
            WHEN substring(tsic_code from 1 for 2)::int IN (29,30) THEN 'AUTOMOTIVE_PARTS'
            WHEN substring(tsic_code from 1 for 2)::int = 31 THEN 'FURNITURE'
            WHEN substring(tsic_code from 1 for 2)::int IN (32,33) THEN 'REPAIR_INSTALLATION'
            ELSE 'OTHER_MFG'
          END as sub_key,
          count(*) as total,
          round(avg(registered_capital)) as avg_capital,
          sum(case when registered_capital >= 50000000 then 1 else 0 end) as enterprise_count
        FROM public.dbd_companies
        WHERE substring(tsic_code from 1 for 2) ~ '^[0-9]+$' 
          AND substring(tsic_code from 1 for 2)::int BETWEEN 10 AND 33
        GROUP BY sub_key
        ORDER BY total DESC;
      `);

      const provRes = await pool.query(`
        SELECT province, count(*) as count
        FROM public.dbd_companies
        WHERE province IS NOT NULL AND province != ''
        GROUP BY province
        ORDER BY count DESC
        LIMIT 15;
      `);

      return NextResponse.json({
        success: true,
        sectors: sectorRes.rows,
        manufacturing_sub: mfgRes.rows,
        top_provinces: provRes.rows,
      });
    }

    // List / Filter mode
    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let pIdx = 1;

    if (tsic2Digit !== 'ALL') {
      conditions.push(`substring(tsic_code from 1 for 2) = $${pIdx++}`);
      values.push(tsic2Digit);
    }

    if (tsicCode !== 'ALL' && tsicCode.trim()) {
      conditions.push(`tsic_code LIKE $${pIdx++}`);
      values.push(`${tsicCode.trim()}%`);
    }

    if (province && province !== 'ALL') {
      conditions.push(`province = $${pIdx++}`);
      values.push(province);
    }

    if (capitalTier === 'ENTERPRISE') {
      conditions.push(`registered_capital >= 50000000`);
    } else if (capitalTier === 'LARGE') {
      conditions.push(`registered_capital BETWEEN 20000000 AND 49999999`);
    } else if (capitalTier === 'MID') {
      conditions.push(`registered_capital BETWEEN 5000000 AND 19999999`);
    } else if (capitalTier === 'SME') {
      conditions.push(`registered_capital < 5000000`);
    }

    if (queryStr.trim()) {
      conditions.push(`(name ILIKE $${pIdx} OR objective ILIKE $${pIdx} OR tsic_code ILIKE $${pIdx})`);
      values.push(`%${queryStr.trim()}%`);
      pIdx++;
    }

    const offset = (page - 1) * limit;
    const listQuery = `
      SELECT id, name as company_name, tax_id, registered_capital, tsic_code, objective, address, subdistrict, district, province, lat, lng
      FROM public.dbd_companies
      WHERE ${conditions.join(' AND ')}
      ORDER BY registered_capital DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countQuery = `
      SELECT count(*) as total
      FROM public.dbd_companies
      WHERE ${conditions.join(' AND ')};
    `;

    const [itemsRes, totalRes] = await Promise.all([
      pool.query(listQuery, values),
      pool.query(countQuery, values),
    ]);

    return NextResponse.json({
      success: true,
      total: parseInt(totalRes.rows[0].total, 10),
      page,
      limit,
      items: itemsRes.rows,
    });
  } catch (err: any) {
    console.error('DBD Analytics error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
