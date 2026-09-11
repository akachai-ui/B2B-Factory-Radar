import fs from 'fs';
import path from 'path';
import { parquetRead } from 'hyparquet';
import pg from 'pg';
import { getCompanyCoordinates } from './geo-centroids.mjs';

const { Pool } = pg;

const BATCH_SIZE = 2500;
const PARQUET_PATH = path.resolve('data/dbd_companies_all.parquet');

function normalizeDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || s === 'null' || s === '-' || s === 'None') return null;

  // YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    let y = parseInt(iso[1], 10);
    if (y > 2400) y -= 543;
    return `${y}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  }

  // DD/MM/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    let y = parseInt(slash[3], 10);
    if (y > 2400) y -= 543;
    return `${y}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`;
  }

  return s.substring(0, 30);
}

async function runImport() {
  console.log('🚀 Starting DBD 390k Parquet Ingestion...');
  const startTime = Date.now();

  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    max: 10
  });

  const client = await pool.connect();

  try {
    console.log('Clearing existing dbd_companies data...');
    await client.query('TRUNCATE TABLE public.dbd_companies RESTART IDENTITY;');

    console.log('Reading parquet file:', PARQUET_PATH);
    const buffer = fs.readFileSync(PARQUET_PATH).buffer;

    let allRows = [];
    await parquetRead({
      file: buffer,
      rowFormat: 'object',
      onComplete: (rows) => {
        allRows = rows;
      }
    });

    console.log(`📊 Loaded ${allRows.length.toLocaleString()} rows from Parquet into memory.`);
    const total = allRows.length;
    let totalInserted = 0;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = allRows.slice(i, i + BATCH_SIZE);

      const values = [];
      const valuePlaceholders = [];
      let paramIdx = 1;

      for (const row of chunk) {
        const taxId = String(row['เลขทะเบียน'] || '').trim();
        const name = String(row['ชื่อนิติบุคคล'] || '').trim();
        const capital = Number(row['ทุนจดทะเบียน']) || 0;
        const tsic = String(row['รหัสวัตถุประสงค์'] || '').trim();
        const objective = String(row['วัตถุประสงค์'] || '').trim();
        const address = String(row['ที่ตั้งสำนักงานใหญ่'] || '').trim();
        const subdistrict = String(row['ตำบล'] || '').trim();
        const district = String(row['อำเภอ'] || '').trim();
        const province = String(row['จังหวัด'] || '').trim();
        const postalCode = String(row['รหัสไปรษณีย์'] || '').trim();
        const regDate = normalizeDate(row['วันที่จดทะเบียน']);
        const dissDate = normalizeDate(row['วันที่จดทะเบียนเลิก']);
        const status = dissDate ? 'DISSOLVED' : 'ACTIVE';

        const { lat, lng } = getCompanyCoordinates(province, district, taxId);

        valuePlaceholders.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
        );

        values.push(
          taxId,
          name,
          capital,
          tsic,
          objective,
          address,
          subdistrict,
          district,
          province,
          postalCode,
          regDate,
          dissDate,
          status,
          lat,
          lng
        );
      }

      const query = `
        INSERT INTO public.dbd_companies (
          tax_id, name, registered_capital, tsic_code, objective,
          address, subdistrict, district, province, postal_code,
          registration_date, dissolution_date, status, lat, lng
        ) VALUES ${valuePlaceholders.join(', ')}
      `;

      await client.query(query, values);
      totalInserted += chunk.length;

      if (totalInserted % 50000 === 0 || totalInserted === total) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const speed = Math.round(totalInserted / (Number(elapsed) || 1));
        console.log(`⚡ Inserted ${totalInserted.toLocaleString()} / ${total.toLocaleString()} rows (${((totalInserted / total) * 100).toFixed(1)}%) | ${speed.toLocaleString()} rows/sec [${elapsed}s]`);
      }
    }

    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 SUCCESS: Successfully imported ${totalInserted.toLocaleString()} DBD company records in ${totalSeconds} seconds!`);

    // Verify row count and top companies
    const countRes = await client.query('SELECT count(*), max(registered_capital) as max_cap FROM public.dbd_companies;');
    console.log('Database Count:', countRes.rows[0]);

    const topSample = await client.query('SELECT name, registered_capital, province, tsic_code FROM public.dbd_companies ORDER BY registered_capital DESC LIMIT 5;');
    console.log('Top 5 Capital Companies:', topSample.rows);

  } catch (err) {
    console.error('❌ Import failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runImport();
