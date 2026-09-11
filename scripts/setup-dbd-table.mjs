import pg from 'pg';

const { Client } = pg;

async function setup() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    console.log('Enabling extensions...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    console.log('Dropping and re-creating table dbd_companies...');
    await client.query(`DROP TABLE IF EXISTS public.dbd_companies CASCADE;`);
    
    await client.query(`
      CREATE TABLE public.dbd_companies (
        id BIGSERIAL PRIMARY KEY,
        tax_id VARCHAR(20) NOT NULL,
        name TEXT NOT NULL,
        registered_capital NUMERIC DEFAULT 0,
        tsic_code VARCHAR(10),
        objective TEXT,
        address TEXT,
        subdistrict TEXT,
        district TEXT,
        province TEXT,
        postal_code VARCHAR(10),
        registration_date VARCHAR(30),
        dissolution_date VARCHAR(30),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      ALTER TABLE public.dbd_companies ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow public read access on dbd_companies" ON public.dbd_companies;
      CREATE POLICY "Allow public read access on dbd_companies" 
        ON public.dbd_companies 
        FOR SELECT 
        TO anon, authenticated 
        USING (true);

      CREATE INDEX IF NOT EXISTS idx_dbd_tax_id ON public.dbd_companies(tax_id);
      CREATE INDEX IF NOT EXISTS idx_dbd_province ON public.dbd_companies(province);
      CREATE INDEX IF NOT EXISTS idx_dbd_district ON public.dbd_companies(district);
      CREATE INDEX IF NOT EXISTS idx_dbd_capital ON public.dbd_companies(registered_capital);
      CREATE INDEX IF NOT EXISTS idx_dbd_tsic ON public.dbd_companies(tsic_code);
      CREATE INDEX IF NOT EXISTS idx_dbd_lat_lng ON public.dbd_companies(lat, lng);
      CREATE INDEX IF NOT EXISTS idx_dbd_status ON public.dbd_companies(status);
      CREATE INDEX IF NOT EXISTS idx_dbd_name_trgm ON public.dbd_companies USING gin (name gin_trgm_ops);
    `);

    console.log('✅ dbd_companies table recreated with robust schema!');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

setup();
