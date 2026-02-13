-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE user_role AS ENUM ('citizen', 'official', 'admin');
CREATE TYPE token_status AS ENUM ('pending', 'waiting', 'serving', 'completed', 'skipped', 'cancelled');

-- 1. PROFILES (Extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL, -- Logical link, same as id
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER ROLES
CREATE TABLE user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role user_role DEFAULT 'citizen',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. OFFICES (Master Data)
CREATE TABLE offices (
  id TEXT PRIMARY KEY, -- Using text IDs to match frontend constants (e.g., 'rto-pune')
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICES (Master Data)
CREATE TABLE services (
  id TEXT PRIMARY KEY, -- e.g., 'vehicle-reg'
  office_id TEXT REFERENCES offices(id) NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCHEMES (Master Data)
CREATE TABLE schemes (
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

-- 6. TOKENS (The Queue)
CREATE TABLE tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  office_id TEXT REFERENCES offices(id) NOT NULL,
  office_name TEXT NOT NULL, -- Denormalized for easier querying
  
  service_id TEXT REFERENCES services(id) NOT NULL,
  service_name TEXT NOT NULL, -- Denormalized
  
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  
  status token_status DEFAULT 'pending',
  
  position_in_queue INTEGER, -- Calculated
  estimated_wait_minutes INTEGER, -- AI/Calculated
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  served_by UUID REFERENCES auth.users(id)
);

-- 7. FEEDBACK
CREATE TABLE feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES ------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User Roles: Viewable by self or officials/admins
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
-- (Triggers will handle role creation, so no INSERT policy needed for now)

-- Offices/Services/Schemes: Public read
CREATE POLICY "Offices are viewable by everyone" ON offices FOR SELECT USING (true);
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (true);
CREATE POLICY "Schemes are viewable by everyone" ON schemes FOR SELECT USING (true);

-- Tokens Policies
-- 1. Citizens can view their own tokens
CREATE POLICY "Citizens view own tokens" ON tokens FOR SELECT USING (auth.uid() = user_id);

-- 2. Officials can view all tokens (Checked via user_roles table)
CREATE POLICY "Officials view all tokens" ON tokens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('official', 'admin')
  )
);

-- 3. Citizens can create tokens (Booking)
CREATE POLICY "Citizens can book tokens" ON tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Citizens can Cancel their own tokens
CREATE POLICY "Citizens can cancel own tokens" ON tokens FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  status = 'cancelled' -- Can only update status to cancelled
);

-- 5. Officials can update tokens (Call next, serve, etc)
CREATE POLICY "Officials can update tokens" ON tokens FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('official', 'admin')
  )
);

-- Feedback: Insert only
CREATE POLICY "Users can insert feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

