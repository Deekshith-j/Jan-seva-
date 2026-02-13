-- Migration: 20260213140000_janseva_schema.sql
-- Description: Overhaul schema for JanSeva (Pan-India Support)

-- 1. DROP EXISTING TABLES (We are changing ID types from TEXT to UUID)
-- We need to drop dependent tables first
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS offices CASCADE;

-- 2. MASTER LOCATION TABLES
-- states table
create table states (
  id uuid primary key default gen_random_uuid(),
  state_code text unique,
  state_name text
);

-- districts table
create table districts (
  id uuid primary key default gen_random_uuid(),
  state_id uuid references states(id),
  district_name text
);

-- cities table
create table cities (
  id uuid primary key default gen_random_uuid(),
  district_id uuid references districts(id),
  city_name text
);

-- 3. OFFICES TABLE (Updated Structure)
create table offices (
  id uuid primary key default gen_random_uuid(),
  state_id uuid references states(id),
  district_id uuid references districts(id),
  city_id uuid references cities(id),
  
  department text,
  office_name text,
  address text,
  pincode text,
  phone text,
  email text,
  latitude numeric,
  longitude numeric,
  working_hours text,
  is_active boolean default true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Extra fields for display
  image_url text
);

-- 4. SERVICES TABLE
create table services (
  id uuid primary key default gen_random_uuid(),
  department text,
  service_name text,
  avg_duration_minutes int,
  required_documents jsonb,
  slot_capacity int,
  priority_allowed boolean default false,
  description text,
  office_id uuid references offices(id) -- Optional: if services are office-specific. 
  -- Note: The prompt implies a global list of services per department, but usually services are linked to offices or departments. 
  -- The prompt's insert statement does NOT have office_id. It seems services are "Template Services" by department.
  -- BUT later in Step 5 it inserts tokens with 'service_name'.
  -- Let's stick to the prompt's `services` design which seems to be a master list of services available.
  -- However, to book a token, we need to know if an office offers that service.
  -- For now, we will assume all offices of a department offer all services of that department.
);

-- 5. TOKENS TABLE (Re-created with UUID references)
CREATE TABLE tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number TEXT NOT NULL, -- Format: KA-RTO-240315-045
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  office_id UUID REFERENCES offices(id) NOT NULL,
  office_name TEXT NOT NULL, -- Denormalized
  
  -- Linking to the master service table is good, but if we just store name it's easier for the prompt's flow.
  -- Let's try to link to services(id) if possible, or just keep service_name/department.
  -- The prompt inserts tokens with `service_name`.
  service_name TEXT NOT NULL,
  department TEXT NOT NULL, -- Added to help filter
  
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  
  status text check (status in ('pending', 'waiting', 'serving', 'completed', 'skipped', 'cancelled')) DEFAULT 'pending',
  
  position_in_queue INTEGER, 
  estimated_wait_minutes INTEGER, 
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  served_by UUID REFERENCES auth.users(id)
);

-- 6. SERVICE LOGS (For Analytics)
create table service_logs (
 id uuid primary key default gen_random_uuid(),
 office_id uuid references offices(id),
 service_name text,
 duration_minutes int,
 created_at timestamp default now()
);

-- 7. ENABLE RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES
-- Public Read Access
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read offices" ON offices FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);

-- Token Policies (Similar to before but adapted)
CREATE POLICY "Citizens view own tokens" ON tokens FOR SELECT USING (auth.uid() = user_id);
-- Officials view all (need to ensure user_roles exists and works)
CREATE POLICY "Officials view all tokens" ON tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);
CREATE POLICY "Citizens book tokens" ON tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Officials update tokens" ON tokens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);

-- Service Logs Policies
CREATE POLICY "Officials view logs" ON service_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);
CREATE POLICY "Officials insert logs" ON service_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);

-- 9. SEED DATA (States)
insert into states (state_code, state_name) values
('AP','Andhra Pradesh'),
('AR','Arunachal Pradesh'),
('AS','Assam'),
('BR','Bihar'),
('CG','Chhattisgarh'),
('GA','Goa'),
('GJ','Gujarat'),
('HR','Haryana'),
('HP','Himachal Pradesh'),
('JH','Jharkhand'),
('KA','Karnataka'),
('KL','Kerala'),
('MP','Madhya Pradesh'),
('MH','Maharashtra'),
('MN','Manipur'),
('ML','Meghalaya'),
('MZ','Mizoram'),
('NL','Nagaland'),
('OD','Odisha'),
('PB','Punjab'),
('RJ','Rajasthan'),
('SK','Sikkim'),
('TN','Tamil Nadu'),
('TS','Telangana'),
('TR','Tripura'),
('UP','Uttar Pradesh'),
('UK','Uttarakhand'),
('WB','West Bengal'),
('DL','Delhi'),
('PY','Puducherry'),
('JK','Jammu & Kashmir'),
('LA','Ladakh'),
('AN','Andaman & Nicobar'),
('CH','Chandigarh'),
('DN','Dadra & Nagar Haveli and Daman & Diu');

-- 10. SEED DATA (Services)
insert into services (department, service_name, avg_duration_minutes, slot_capacity, priority_allowed, required_documents) values
('RTO','Driving License Test',20,40,true,'["Aadhaar","Learner License","Photos"]'),
('RTO','Vehicle Registration',25,35,false,'["Invoice","Insurance","Form20"]'),
('Passport','New Passport',15,60,true,'["Aadhaar","Birth Certificate","Address Proof"]'),
('Passport','Passport Renewal',10,80,true,'["Old Passport","Aadhaar"]'),
('Aadhaar','New Enrollment',12,100,true,'["Birth Certificate"]'),
('Aadhaar','Update Mobile Number',8,120,true,'["Aadhaar"]'),
('Municipal','Birth Certificate',10,90,true,'["Hospital Record"]'),
('Municipal','Death Certificate',10,90,true,'["Hospital Record"]'),
('Hospital','General OPD',7,300,true,'["Patient ID"]'),
('Hospital','Vaccination',5,400,true,'["ID Proof"]'),
('Revenue','Income Certificate',15,70,false,'["Aadhaar","Ration Card"]'),
('Revenue','Caste Certificate',18,60,false,'["Aadhaar","Parent Certificate"]'),
('Electricity','New Connection',20,50,false,'["Property Proof","ID Proof"]'),
('Police','Police Verification',12,100,false,'["ID Proof","Address Proof"]');

-- 11. SEED SAMPLE HISTORY (Service Logs)
-- Need offices first.

-- 12. SEED SAMPLE OFFICES & LOCATIONS
-- KA
DO $$
DECLARE
  ka_id uuid;
  ts_id uuid;
  mh_id uuid;
  dl_id uuid;
  dist_id uuid;
  city_id uuid;
  office_id_val uuid;
BEGIN
  -- 1. Karnataka Setup
  SELECT id INTO ka_id FROM states WHERE state_code='KA';
  INSERT INTO districts (state_id, district_name) VALUES (ka_id, 'Bengaluru Urban') RETURNING id INTO dist_id;
  INSERT INTO cities (district_id, city_name) VALUES (dist_id, 'Bengaluru') RETURNING id INTO city_id;
  
  INSERT INTO offices (state_id, district_id, city_id, department, office_name, address, pincode, phone, working_hours)
  VALUES (ka_id, dist_id, city_id, 'RTO', 'Bangalore Central RTO', 'Koramangala, Bengaluru', '560034', '08022334455', '9:30 AM - 5:30 PM')
  RETURNING id INTO office_id_val;

  -- History for RTO
  insert into service_logs (office_id, service_name, duration_minutes)
  select office_id_val, 'Driving License Test', (10 + floor(random()*20))::int from generate_series(1, 10);


  -- 2. Telangana Setup
  SELECT id INTO ts_id FROM states WHERE state_code='TS';
  INSERT INTO districts (state_id, district_name) VALUES (ts_id, 'Hyderabad') RETURNING id INTO dist_id;
  INSERT INTO cities (district_id, city_name) VALUES (dist_id, 'Hyderabad') RETURNING id INTO city_id;

  INSERT INTO offices (state_id, district_id, city_id, department, office_name, address, pincode, phone, working_hours)
  VALUES (ts_id, dist_id, city_id, 'Passport', 'Hyderabad Passport Seva Kendra', 'Ameerpet, Hyderabad', '500016', '04033445566', '9:00 AM - 4:00 PM');

  -- 3. Maharashtra Setup
  SELECT id INTO mh_id FROM states WHERE state_code='MH';
  INSERT INTO districts (state_id, district_name) VALUES (mh_id, 'Pune') RETURNING id INTO dist_id;
  INSERT INTO cities (district_id, city_name) VALUES (dist_id, 'Pune') RETURNING id INTO city_id;

  INSERT INTO offices (state_id, district_id, city_id, department, office_name, address, pincode, phone, working_hours)
  VALUES (mh_id, dist_id, city_id, 'Municipal', 'Pune Municipal Office', 'Shivajinagar, Pune', '411005', '02025501111', '10:00 AM - 6:00 PM');

  -- 4. Delhi Setup
  SELECT id INTO dl_id FROM states WHERE state_code='DL';
  INSERT INTO districts (state_id, district_name) VALUES (dl_id, 'New Delhi') RETURNING id INTO dist_id;
  INSERT INTO cities (district_id, city_name) VALUES (dist_id, 'New Delhi') RETURNING id INTO city_id;

  INSERT INTO offices (state_id, district_id, city_id, department, office_name, address, pincode, phone, working_hours)
  VALUES (dl_id, dist_id, city_id, 'Hospital', 'AIIMS Delhi OPD', 'Ansari Nagar, Delhi', '110029', '01126588500', '8:00 AM - 2:00 PM');

END $$;
