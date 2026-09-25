-- ==============================================================================
-- RouteHunter / B2B Factory Radar - Phase 1: Clean Auth & Profiles Schema
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

-- RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on leads" ON public.leads;
CREATE POLICY "Allow public read access on leads" 
  ON public.leads 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 3. Table: companies (ตารางข้อมูลบริษัทแม่)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  branch TEXT DEFAULT 'สำนักงานใหญ่',
  phone TEXT,
  address TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to companies" ON public.companies;
CREATE POLICY "Allow read access to companies"
  ON public.companies
  FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Allow insert companies" ON public.companies;
CREATE POLICY "Allow insert companies"
  ON public.companies
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update companies" ON public.companies;
CREATE POLICY "Allow update companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3.1 Table: system_admins (ตารางผู้ดูแลระบบสูงสุด Super Admin ระดับแพลตฟอร์ม)
CREATE TABLE IF NOT EXISTS public.system_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'super_admin', -- 'super_admin', 'support', 'billing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read system_admins" ON public.system_admins;
CREATE POLICY "Allow read system_admins"
  ON public.system_admins FOR SELECT
  TO authenticated, anon
  USING (true);

-- Pre-seed Super Admin
INSERT INTO public.system_admins (email, role)
VALUES ('akachaiha@gmail.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 4. Table: profiles (ตารางเก็บข้อมูลโปรไฟล์ผู้ใช้ เชื่อมโยง company_id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT DEFAULT 'individual', -- 'individual' หรือ 'company'
  company_name TEXT DEFAULT 'บริษัทของฉัน',
  tax_id TEXT,                            -- เลขผู้เสียภาษี 13 หลัก
  branch TEXT DEFAULT 'สำนักงานใหญ่',      -- สำนักงานใหญ่ หรือ สาขา
  phone TEXT,
  onboarded BOOLEAN DEFAULT FALSE,       -- สถานะการยืนยันตัวตนครั้งแรก
  role TEXT DEFAULT 'owner',             -- 'owner', 'manager', 'sales'
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL, -- รหัสอ้างอิงสังกัดบริษัท
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop restrictive foreign keys so profiles can store owner/team UUID directly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Allow reading profiles for Team / Directory / Dev Overview
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access to profiles" ON public.profiles;
CREATE POLICY "Allow read access to profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 2. Update Policy: Allow updating profiles (Self or Team Members)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profile" ON public.profiles;
CREATE POLICY "Allow update profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Insert Policy: Allow inserting new profile / team member
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile" ON public.profiles;
CREATE POLICY "Allow insert profile"
  ON public.profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 4. Delete Policy: Allow cleaning up duplicate profiles
DROP POLICY IF EXISTS "Allow delete profile" ON public.profiles;
CREATE POLICY "Allow delete profile"
  ON public.profiles
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- 4. Database Trigger: สร้าง Company & Profile อัตโนมัติทันทีที่ User ลงทะเบียนสำเร็จ (Company-First Architecture with Team Invitation Auto-Link)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_company_name TEXT;
  v_invite RECORD;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- 0. Check if this email has an existing pending or accepted team invitation
  SELECT * INTO v_invite 
  FROM public.team_invitations 
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    AND status IN ('pending', 'accepted')
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_invite.id IS NOT NULL THEN
    -- A. User was invited by a Company Owner: Link directly to the company (NO new company row)
    INSERT INTO public.profiles (
      id, email, full_name, company_name, company_id, account_type, role, access_status, onboarded
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_invite.company_name,
      v_invite.company_id,
      'company',
      COALESCE(v_invite.role, 'sales'),
      'PRO_UNLOCKED',
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      company_id = v_invite.company_id,
      company_name = v_invite.company_name,
      role = COALESCE(v_invite.role, 'sales'),
      access_status = 'PRO_UNLOCKED',
      onboarded = TRUE;

    -- Mark invitation as accepted
    UPDATE public.team_invitations
    SET status = 'accepted', updated_at = timezone('utc'::text, now())
    WHERE id = v_invite.id;

  ELSE
    -- B. Standalone User: Create personal company record and owner profile
    v_company_name := 'ทีมของ ' || v_full_name;

    INSERT INTO public.companies (id, name, branch, owner_id)
    VALUES (NEW.id, v_company_name, 'สำนักงานใหญ่', NEW.id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, company_name, company_id, account_type, role, onboarded)
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_company_name,
      NEW.id,
      'company',
      'owner',
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      company_id = COALESCE(public.profiles.company_id, EXCLUDED.company_id),
      company_name = COALESCE(public.profiles.company_name, EXCLUDED.company_name);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Table: team_invitations (ตารางเก็บคำเชิญเข้าร่วมทีม)
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'sales',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'canceled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to team_invitations" ON public.team_invitations;
CREATE POLICY "Allow read access to team_invitations"
  ON public.team_invitations FOR SELECT
  TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow insert team_invitations" ON public.team_invitations;
CREATE POLICY "Allow insert team_invitations"
  ON public.team_invitations FOR INSERT
  TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update team_invitations" ON public.team_invitations;
CREATE POLICY "Allow update team_invitations"
  ON public.team_invitations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete team_invitations" ON public.team_invitations;
CREATE POLICY "Allow delete team_invitations"
  ON public.team_invitations FOR DELETE
  TO authenticated, anon USING (true);

-- 6. Storage Bucket: avatars (มาตรฐานสากลสำหรับจัดเก็บรูปโปรไฟล์)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow upload avatar" ON storage.objects;
CREATE POLICY "Allow upload avatar"
  ON storage.objects FOR INSERT
  TO authenticated, anon
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow update avatar" ON storage.objects;
CREATE POLICY "Allow update avatar"
  ON storage.objects FOR UPDATE
  TO authenticated, anon
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow delete avatar" ON storage.objects;
CREATE POLICY "Allow delete avatar"
  ON storage.objects FOR DELETE
  TO authenticated, anon
  USING (bucket_id = 'avatars');

-- 7. Table: dbd_companies (คลังข้อมูล Big Data นิติบุคคล DBD ทั่วประเทศ 390,924 บริษัท)
CREATE TABLE IF NOT EXISTS public.dbd_companies (
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
  phone TEXT,
  website TEXT,
  place_id TEXT,
  rating DOUBLE PRECISION,
  user_ratings_total INTEGER,
  formatted_address TEXT,
  is_geocoded BOOLEAN DEFAULT FALSE,
  geocoded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dbd_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on dbd_companies" ON public.dbd_companies;
CREATE POLICY "Allow public read access on dbd_companies" 
  ON public.dbd_companies FOR SELECT TO anon, authenticated USING (true);

-- 8. Table: company_leads (พอร์ตโฟลิโอลูกค้าและท่อส่งงานขาย CRM ระดับ SaaS)
CREATE TABLE IF NOT EXISTS public.company_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_type VARCHAR(30) DEFAULT 'dbd',
  dbd_id BIGINT REFERENCES public.dbd_companies(id) ON DELETE SET NULL,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
  place_id TEXT,
  company_name TEXT NOT NULL,
  tax_id VARCHAR(20),
  registered_capital NUMERIC DEFAULT 0,
  tsic_code VARCHAR(10),
  objective TEXT,
  address TEXT,
  subdistrict TEXT,
  district TEXT,
  province TEXT,
  postal_code VARCHAR(10),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_person TEXT,
  status VARCHAR(30) DEFAULT 'NEW',
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  deal_value NUMERIC DEFAULT 0,
  notes TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.company_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to view their company leads" ON public.company_leads;
CREATE POLICY "Allow members to view their company leads"
  ON public.company_leads FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow members to insert their company leads" ON public.company_leads;
CREATE POLICY "Allow members to insert their company leads"
  ON public.company_leads FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to update their company leads" ON public.company_leads;
CREATE POLICY "Allow members to update their company leads"
  ON public.company_leads FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to delete their company leads" ON public.company_leads;
CREATE POLICY "Allow members to delete their company leads"
  ON public.company_leads FOR DELETE TO authenticated, anon USING (true);

-- 9. Table: lead_activities (ประวัติการติดต่อและบันทึกกิจกรรมลูกค้า CRM Timeline)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_lead_id UUID NOT NULL REFERENCES public.company_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type VARCHAR(30) DEFAULT 'NOTE', -- 'CALL', 'MEETING', 'QUOTATION', 'LINE', 'NOTE', 'STATUS_CHANGE'
  content TEXT NOT NULL,
  status_change VARCHAR(30),
  deal_value_change NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to view their lead activities" ON public.lead_activities;
CREATE POLICY "Allow members to view their lead activities"
  ON public.lead_activities FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow members to insert their lead activities" ON public.lead_activities;
CREATE POLICY "Allow members to insert their lead activities"
  ON public.lead_activities FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to update their lead activities" ON public.lead_activities;
CREATE POLICY "Allow members to update their lead activities"
  ON public.lead_activities FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to delete their lead activities" ON public.lead_activities;
CREATE POLICY "Allow members to delete their lead activities"
  ON public.lead_activities FOR DELETE TO authenticated, anon USING (true);

-- 10. Table: vehicle_trips (บันทึกทริปการเดินทาง เลขไมล์ และระบบคำนวณค่าน้ำมัน)
CREATE TABLE IF NOT EXISTS public.vehicle_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- ข้อมูลยานพาหนะ
  vehicle_type VARCHAR(30) DEFAULT 'car',      -- 'car' (รถยนต์), 'motorcycle' (มอเตอร์ไซค์), 'van' (รถตู้)
  license_plate VARCHAR(30),                  -- ทะเบียนรถ เช่น 1กข-9999
  
  -- จุดเริ่มต้น (Start Day)
  start_odometer NUMERIC NOT NULL,            -- เลขไมล์เริ่มต้น (เช่น 120000)
  start_photo_url TEXT,                       -- รูปถ่ายหน้าปัดไมล์เช้า
  start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  start_location_name TEXT,
  
  -- จุดสิ้นสุด (End Day)
  end_odometer NUMERIC,                       -- เลขไมล์สิ้นสุด (เช่น 120060)
  end_photo_url TEXT,                         -- รูปถ่ายหน้าปัดไมล์เย็น
  end_time TIMESTAMP WITH TIME ZONE,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  end_location_name TEXT,
  
  -- ผลการคำนวณระยะทาง
  total_odometer_km NUMERIC,                  -- ไมล์วิ่งจริง (end - start)
  total_route_km NUMERIC DEFAULT 0,           -- ระยะทางตามรูทลูกค้าที่เช็คอินจริง
  personal_deduct_km NUMERIC DEFAULT 0,       -- ระยะทางหักธุระส่วนตัว
  net_claimable_km NUMERIC,                   -- กิโลเมตรสุทธิที่ขอเบิก
  
  -- ยอดเงินค่าน้ำมัน
  fuel_rate_per_km NUMERIC DEFAULT 5.0,       -- อัตราค่าน้ำมัน (เช่น 5.0 บาท/กม.)
  total_fuel_amount NUMERIC,                  -- ยอดเงินค่าน้ำมันรวม (บาท)
  
  -- สถานะและการอนุมัติ
  status VARCHAR(30) DEFAULT 'in_progress',   -- 'in_progress', 'completed', 'approved', 'rejected'
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to view their vehicle trips" ON public.vehicle_trips;
CREATE POLICY "Allow members to view their vehicle trips"
  ON public.vehicle_trips FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow members to insert their vehicle trips" ON public.vehicle_trips;
CREATE POLICY "Allow members to insert their vehicle trips"
  ON public.vehicle_trips FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to update their vehicle trips" ON public.vehicle_trips;
CREATE POLICY "Allow members to update their vehicle trips"
  ON public.vehicle_trips FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to delete their vehicle trips" ON public.vehicle_trips;
CREATE POLICY "Allow members to delete their vehicle trips"
  ON public.vehicle_trips FOR DELETE TO authenticated, anon USING (true);

-- 11. Table: trip_checkins (บันทึกจุดเช็คอินโรงงาน/สถานที่ระหว่างวัน)
CREATE TABLE IF NOT EXISTS public.trip_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.vehicle_trips(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_lead_id UUID REFERENCES public.company_leads(id) ON DELETE SET NULL,
  
  checkin_type VARCHAR(30) DEFAULT 'CLIENT_VISIT', -- 'CLIENT_VISIT', 'LUNCH_BREAK', 'GAS_STATION', 'OTHER'
  location_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  distance_from_prev_km NUMERIC DEFAULT 0,
  photo_url TEXT,
  notes TEXT,
  
  checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trip_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow members to view their trip checkins" ON public.trip_checkins;
CREATE POLICY "Allow members to view their trip checkins"
  ON public.trip_checkins FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow members to insert their trip checkins" ON public.trip_checkins;
CREATE POLICY "Allow members to insert their trip checkins"
  ON public.trip_checkins FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to update their trip checkins" ON public.trip_checkins;
CREATE POLICY "Allow members to update their trip checkins"
  ON public.trip_checkins FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow members to delete their trip checkins" ON public.trip_checkins;
CREATE POLICY "Allow members to delete their trip checkins"
  ON public.trip_checkins FOR DELETE TO authenticated, anon USING (true);

-- Enable Supabase Realtime for Trips & Checkins
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_trips, public.trip_checkins;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

-- 12. Storage Bucket: trip-photos (สำหรับจัดเก็บรูปถ่ายหน้าปัดไมล์และรูปถ่ายเช็คอิน)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-photos',
  'trip-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public can view trip photos" ON storage.objects;
CREATE POLICY "Public can view trip photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'trip-photos');

DROP POLICY IF EXISTS "Allow upload trip photos" ON storage.objects;
CREATE POLICY "Allow upload trip photos"
  ON storage.objects FOR INSERT TO authenticated, anon
  WITH CHECK (bucket_id = 'trip-photos');

DROP POLICY IF EXISTS "Allow update trip photos" ON storage.objects;
CREATE POLICY "Allow update trip photos"
  ON storage.objects FOR UPDATE TO authenticated, anon
  USING (bucket_id = 'trip-photos');

DROP POLICY IF EXISTS "Allow delete trip photos" ON storage.objects;
CREATE POLICY "Allow delete trip photos"
  ON storage.objects FOR DELETE TO authenticated, anon
  USING (bucket_id = 'trip-photos');

-- 13. Table: company_fuel_policies (นโยบายและสูตรคำนวณค่าน้ำมันประจำบริษัท สำหรับ Owner / Admin)
CREATE TABLE IF NOT EXISTS public.company_fuel_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- 1. อัตราค่าน้ำมันมาตรฐานแยกตามประเภทรถ (บาท/กม.)
  car_rate_per_km NUMERIC DEFAULT 5.0,           -- รถยนต์
  motorcycle_rate_per_km NUMERIC DEFAULT 2.5,    -- มอเตอร์ไซค์
  van_rate_per_km NUMERIC DEFAULT 6.0,           -- รถกระบะ / รถตู้
  
  -- 2. นโยบายการคำนวณ
  calculation_mode VARCHAR(30) DEFAULT 'odometer', -- 'odometer', 'gps_route', 'min_rule'
  variance_tolerance_pct NUMERIC DEFAULT 15.0,    -- % ส่วนต่างที่ยอมรับได้
  
  -- 3. ความปลอดภัยและข้อกำหนด
  require_photo_odometer BOOLEAN DEFAULT TRUE,   -- บังคับถ่ายรูปไมล์เช้า/เย็น
  require_client_checkin BOOLEAN DEFAULT TRUE,   -- ต้องมีเช็คอินลูกค้าอย่างน้อย 1 จุด
  allow_sales_override_rate BOOLEAN DEFAULT FALSE,-- อนุญาตให้เซลส์แก้เรทเองได้หรือไม่
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.company_fuel_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read company_fuel_policies" ON public.company_fuel_policies;
CREATE POLICY "Allow read company_fuel_policies"
  ON public.company_fuel_policies FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow insert company_fuel_policies" ON public.company_fuel_policies;
CREATE POLICY "Allow insert company_fuel_policies"
  ON public.company_fuel_policies FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update company_fuel_policies" ON public.company_fuel_policies;
CREATE POLICY "Allow update company_fuel_policies"
  ON public.company_fuel_policies FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

