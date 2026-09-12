import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Parse command-line args
const args = process.argv.slice(2);
function getArg(flag, defaultValue = null) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultValue;
}

// Load env local if present
const envPath = path.resolve('.env.local');
let envFile = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) envFile[k.trim()] = v.join('=').trim();
  });
}

const API_KEY = getArg('--key') || process.env.GOOGLE_MAPS_API_KEY || envFile.GOOGLE_MAPS_API_KEY || envFile.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PROVINCE = getArg('--province');
const MIN_CAPITAL = getArg('--min-capital') ? parseFloat(getArg('--min-capital')) : null;
const LIMIT = getArg('--limit') ? parseInt(getArg('--limit'), 10) : 50;
const DELAY_MS = getArg('--delay') ? parseInt(getArg('--delay'), 10) : 150;
const FETCH_DETAILS = args.includes('--details');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchGooglePlace(companyName, address, district, province, apiKey) {
  try {
    // Primary query: Company Name + District + Province
    const cleanName = companyName.replace(/จำกัด\s*\(มหาชน\)/g, '').replace(/จำกัด/g, '').trim();
    const query = `${cleanName} ${district || ''} ${province || ''}`.trim();
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=th&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const best = data.results[0];
      return {
        success: true,
        place_id: best.place_id,
        lat: best.geometry?.location?.lat,
        lng: best.geometry?.location?.lng,
        formatted_address: best.formatted_address,
        rating: best.rating || null,
        user_ratings_total: best.user_ratings_total || 0,
      };
    }

    // Fallback: Geocode using street address
    if (address) {
      const geoQuery = `${address} ${district || ''} ${province || ''}`.trim();
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geoQuery)}&language=th&key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData.status === 'OK' && geoData.results?.length > 0) {
        const bestGeo = geoData.results[0];
        return {
          success: true,
          place_id: bestGeo.place_id,
          lat: bestGeo.geometry?.location?.lat,
          lng: bestGeo.geometry?.location?.lng,
          formatted_address: bestGeo.formatted_address,
          rating: null,
          user_ratings_total: 0,
        };
      }
    }

    return { success: false, reason: data.status || 'ZERO_RESULTS' };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

async function fetchPlaceDetails(placeId, apiKey) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,international_phone_number,website&language=th&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.result) {
      return {
        phone: data.result.formatted_phone_number || data.result.international_phone_number || null,
        website: data.result.website || null,
      };
    }
    return { phone: null, website: null };
  } catch (err) {
    return { phone: null, website: null };
  }
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 Google Maps Enrichment Pipeline for DBD Companies');
  console.log('=====================================================');

  if (!API_KEY) {
    console.error('❌ ERROR: Missing Google Maps API Key.');
    console.log('\n👉 วิธีรัน:');
    console.log('node scripts/enrich-google-places.mjs --key YOUR_GOOGLE_API_KEY --limit 50 --province "สมุทรปราการ"');
    console.log('หรือใส่ GOOGLE_MAPS_API_KEY=your_key ใน .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    max: 5,
  });

  const client = await pool.connect();

  try {
    const conditions = ['(is_geocoded IS FALSE OR is_geocoded IS NULL)'];
    const params = [];
    let pIdx = 1;

    if (PROVINCE && PROVINCE !== 'ALL') {
      conditions.push(`province = $${pIdx++}`);
      params.push(PROVINCE);
    }

    if (MIN_CAPITAL) {
      conditions.push(`registered_capital >= $${pIdx++}`);
      params.push(MIN_CAPITAL);
    }

    const query = `
      SELECT id, tax_id, name, address, subdistrict, district, province, postal_code, registered_capital
      FROM public.dbd_companies
      WHERE ${conditions.join(' AND ')}
      ORDER BY registered_capital DESC
      LIMIT $${pIdx++};
    `;
    params.push(LIMIT);

    const rowsRes = await client.query(query, params);
    const companies = rowsRes.rows;

    console.log(`📋 Found ${companies.length} DBD companies to enrich with Google Maps.`);
    console.log(`⚙️ Settings: Province=${PROVINCE || 'All'} | MinCapital=${MIN_CAPITAL || 'None'} | FetchDetails=${FETCH_DETAILS}\n`);

    let successCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < companies.length; i++) {
      const c = companies[i];
      const prefix = `[${i + 1}/${companies.length}]`;
      console.log(`${prefix} Searching: ${c.name} (${c.district} ${c.province}) | ทุน: ${Number(c.registered_capital).toLocaleString()}฿...`);

      const result = await searchGooglePlace(c.name, c.address, c.district, c.province, API_KEY);

      if (result.success) {
        let phone = null;
        let website = null;

        if (FETCH_DETAILS && result.place_id) {
          const details = await fetchPlaceDetails(result.place_id, API_KEY);
          phone = details.phone;
          website = details.website;
        }

        // Update company in database
        await client.query(
          `
          UPDATE public.dbd_companies
          SET 
            lat = $1,
            lng = $2,
            place_id = $3,
            formatted_address = $4,
            rating = $5,
            user_ratings_total = $6,
            phone = COALESCE($7, phone),
            website = COALESCE($8, website),
            is_geocoded = TRUE,
            geocoded_at = NOW()
          WHERE id = $9;
        `,
          [
            result.lat,
            result.lng,
            result.place_id,
            result.formatted_address,
            result.rating,
            result.user_ratings_total,
            phone,
            website,
            c.id,
          ]
        );

        successCount++;
        console.log(`   ✅ Matched! GPS: (${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}) | PlaceID: ${result.place_id} ${phone ? `| 📞 ${phone}` : ''}`);
      } else {
        // Mark as attempted so we don't query repeatedly
        await client.query(
          `UPDATE public.dbd_companies SET is_geocoded = TRUE, geocoded_at = NOW() WHERE id = $1;`,
          [c.id]
        );
        notFoundCount++;
        console.log(`   ⚠️ Not found on Google Maps (${result.reason})`);
      }

      await sleep(DELAY_MS);
    }

    console.log('\n=====================================================');
    console.log(`🎉 Enrichment Complete: ${successCount} successfully matched, ${notFoundCount} not found.`);
    console.log('=====================================================');
  } catch (err) {
    console.error('❌ Pipeline Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
