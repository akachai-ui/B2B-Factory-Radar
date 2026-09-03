-- ==============================================================================
-- RouteHunter (B2B Multi-Tenant Company & Team Architecture)
-- Supabase Schema Migration: Companies, Profiles, and Shared Lead Pipeline
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: companies (องค์กร / นิติบุคคลเจ้าของแพ็กเกจ)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tax_id TEXT,
  phone TEXT,
  address TEXT DEFAULT 'สมุทรปราการ',
  lat DOUBLE PRECISION DEFAULT 13.6304636,
  lng DOUBLE PRECISION DEFAULT 100.708154,
  radius_km INTEGER DEFAULT 15,
  subscription_tier TEXT DEFAULT 'pro', -- 'starter', 'pro', 'enterprise'
  max_seats INTEGER DEFAULT 5,          -- จำนวนเซลส์ที่อนุญาตในทีม
  invite_code TEXT UNIQUE,              -- รหัสชวนเซลส์เข้าร่วมทีม (เช่น RH-8899)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table: profiles (ข้อมูลผู้ใช้ / เซลส์ สังกัดบริษัท)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'owner',            -- 'owner' (เจ้าของ), 'manager' (หัวหน้าเซลส์), 'sales' (พนักงานขาย)
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT,                    -- Cached display name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table: lead_interactions (สถานะติดตามและบันทึกโน้ต - แชร์ร่วมกันทั้งบริษัท)
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,                       -- ชื่อเซลส์ที่อัปเดตล่าสุด
  place_id TEXT NOT NULL,               -- รหัสโรงงาน
  status TEXT DEFAULT 'NEW',            -- 'NEW', 'CONTACTED', 'MEETING', 'QUOTED', 'WON', 'LOST'
  note TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (company_id, place_id)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- 7. RLS Policies for Companies
DROP POLICY IF EXISTS "Members can view own company" ON public.companies;
DROP POLICY IF EXISTS "Users can create company" ON public.companies;
DROP POLICY IF EXISTS "Owners can update own company" ON public.companies;

CREATE POLICY "Users can create company" ON public.companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Members can view own company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Owners can update own company" ON public.companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- 8. RLS Policies for Lead Interactions (Team Shared)
DROP POLICY IF EXISTS "Members can view team lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Members can update team lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Users can manage own lead interactions" ON public.lead_interactions;

CREATE POLICY "Members can view team lead interactions" ON public.lead_interactions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can update team lead interactions" ON public.lead_interactions
  FOR ALL USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );
