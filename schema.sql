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

-- 4. Database Trigger: สร้าง Profile อัตโนมัติทันทีที่ User ลงทะเบียนสำเร็จ (Google หรือ Email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'บริษัทของฉัน'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
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



