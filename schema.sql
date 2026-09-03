-- Supabase Schema for B2B Factory Radar

-- 1. Table: profiles (User SaaS Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_lat DOUBLE PRECISION DEFAULT 13.6304636,
  company_lng DOUBLE PRECISION DEFAULT 100.708154,
  company_radius_km INTEGER DEFAULT 15,
  subscription_tier TEXT DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: lead_interactions (CRM Status & Notes tracking per User)
CREATE TABLE IF NOT EXISTS public.lead_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  status TEXT DEFAULT 'NEW',
  note TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, place_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for lead_interactions
CREATE POLICY "Users can view own lead interactions" ON public.lead_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own lead interactions" ON public.lead_interactions
  FOR ALL USING (auth.uid() = user_id);
