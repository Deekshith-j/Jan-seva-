-- DATA RESET & FIX SCRIPT
-- This script cleans up conflicting schemas and re-applies the correct SevaPali schema.
-- WARNING: This will delete existing data in the custom tables (profiles, tokens, etc).

BEGIN;

-- 1. Drop existing objects to clear conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP TRIGGER IF EXISTS on_token_created ON public.tokens;
DROP FUNCTION IF EXISTS public.handle_new_token() CASCADE;

DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.tokens CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.offices CASCADE;
DROP TABLE IF EXISTS public.schemes CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.app_role;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.token_status;

-- 2. Re-create Types
CREATE TYPE public.user_role AS ENUM ('citizen', 'official', 'admin');
CREATE TYPE public.token_status AS ENUM ('pending', 'waiting', 'serving', 'completed', 'skipped', 'cancelled');

-- 3. Re-create Tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.user_role DEFAULT 'citizen',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.offices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.services (
  id TEXT PRIMARY KEY,
  office_id TEXT REFERENCES public.offices(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.schemes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  eligibility TEXT,
  benefits TEXT,
  category TEXT,
  apply_link TEXT,
  is_new BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  office_id TEXT REFERENCES public.offices(id) NOT NULL,
  office_name TEXT NOT NULL,
  service_id TEXT REFERENCES public.services(id) NOT NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status public.token_status DEFAULT 'pending',
  position_in_queue INTEGER,
  estimated_wait_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  served_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Re-apply RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Offices are viewable by everyone" ON public.offices FOR SELECT USING (true);
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Schemes are viewable by everyone" ON public.schemes FOR SELECT USING (true);

CREATE POLICY "Citizens view own tokens" ON public.tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officials view all tokens" ON public.tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);
CREATE POLICY "Citizens can book tokens" ON public.tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Citizens can cancel own tokens" ON public.tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status = 'cancelled');
CREATE POLICY "Officials can update tokens" ON public.tokens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);

CREATE POLICY "Users can insert feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Re-create Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, phone)
  VALUES (new.id, new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'citizen'));
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to citizen if casting fails (e.g. invalid role in metadata)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'citizen');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_token()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.tokens
  WHERE office_id = new.office_id
    AND appointment_date = new.appointment_date
    AND status IN ('waiting', 'pending', 'serving');
    
  new.position_in_queue := v_count + 1;
  new.estimated_wait_minutes := (v_count + 1) * 15;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_token_created
  BEFORE INSERT ON public.tokens
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_token();

COMMIT;
