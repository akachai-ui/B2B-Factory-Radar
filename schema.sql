-- ==============================================================================
-- RouteHunter / B2B Factory Radar - Clean Schema (Leads Only)
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: leads (ฐานข้อมูลโรงงานอุตสาหกรรม สมุทรปราการ 989 แห่ง)
CREATE TABLE IF NOT EXISTS public.leads (
  id BIGSERIAL PRIMARY KEY,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  address TEXT,
  road TEXT,
  district TEXT,
  subdistrict TEXT,
  province TEXT DEFAULT 'สมุทรปราการ',
  postal_code TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  maps_url TEXT,
  rating DOUBLE PRECISION,
  user_ratings_total INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS) for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on leads" ON public.leads;
CREATE POLICY "Allow public read access on leads" 
  ON public.leads 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- ==============================================================================
-- CLEAN RESET SCRIPT (ลบตารางและข้อมูลเสริมทั้งหมด เหลือเฉพาะ public.leads)
-- ==============================================================================
-- DROP TABLE IF EXISTS public.lead_interactions CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.companies CASCADE;
-- DELETE FROM auth.users;

