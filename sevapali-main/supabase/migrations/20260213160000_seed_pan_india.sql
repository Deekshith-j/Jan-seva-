-- Migration: 20260213160000_seed_pan_india.sql
-- Description: Apply Pan-India Seed Data (Replaces existing location/service data)

-- 1. CLEANUP (Drop existing to ensure clean state)
DROP TABLE IF EXISTS service_logs CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS states CASCADE;

-- 2. CREATE TABLES
-- states
create table states (
  id uuid primary key default gen_random_uuid(),
  state_code text unique,
  state_name text
);

-- districts
create table districts (
  id uuid primary key default gen_random_uuid(),
  state_id uuid references states(id),
  district_name text
);

-- cities
create table cities (
  id uuid primary key default gen_random_uuid(),
  district_id uuid references districts(id),
  city_name text
);

-- offices
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
  
  -- Extra fields to match previous schema/app needs
  image_url text,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- services
create table services (
  id uuid primary key default gen_random_uuid(),
  department text,
  service_name text,
  avg_duration_minutes int,
  required_documents jsonb,
  slot_capacity int,
  priority_allowed boolean default false,
  description text -- Kept from previous schema for compatibility
);

-- tokens (Re-created to match app expectations)
CREATE TABLE tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number TEXT NOT NULL, 
  user_id UUID REFERENCES auth.users(id), -- Nullable for seed data? No, app expects user. 
  -- User seed data has no user_id? 
  -- The prompt's insert: `values ('KA-RTO...', ... 'pending')`. No user_id.
  -- I must make user_id nullable OR dummy it?
  -- If I make it nullable, app might break if it expects `user_id`.
  -- App: `useMyTokens` filters by `user_id`. `useTokens` (official) views all.
  -- If `user_id` is null, it won't show in "My Tokens" but will show in "Queue".
  -- I will make `user_id` nullable to support the seed script.
  office_id UUID REFERENCES offices(id), -- Prompt insert has `office_name` but not ID. 
  -- App uses `office_id`. 
  -- I need to map `office_name` to `office_id` during insert or make `office_id` nullable?
  -- App DEFINITELY needs `office_id` for queue logic.
  -- The seed script `LAST STEP` inserts tokens.
  -- `insert into tokens ... values ...`. It provides `office_name`.
  -- It does NOT provide `office_id`.
  -- This will FAIL if `office_id` is NOT NULL and not provided.
  -- I will make `office_id` nullable but I should try to populate it via trigger or just manual lookup in the script?
  -- Only 3 tokens. I can rewrite the insert to look up the ID.
  
  office_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  department TEXT, -- Derived?
  
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

-- service_logs
create table service_logs (
 id uuid primary key default gen_random_uuid(),
 office_id uuid references offices(id),
 service_name text,
 duration_minutes int,
 created_at timestamp default now()
);

-- 3. ENABLE RLS & POLICIES (Copy from previous)
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read offices" ON offices FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Citizens view own tokens" ON tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officials view all tokens" ON tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);
CREATE POLICY "Citizens book tokens" ON tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow seed data (public insert for testing?) No.

-- 4. INSERT DATA
-- States
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
('DN','Dadra & Nagar Haveli and Daman & Diu'),
('LD','Lakshadweep');

-- Services
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

-- Offices (Using DO block to lookup IDs)
insert into offices (state_id, department, office_name, address, pincode, phone, working_hours)
select id,'RTO','Bangalore Central RTO','Koramangala, Bengaluru','560034','08022334455','9:30 AM - 5:30 PM' from states where state_code='KA';

insert into offices (state_id, department, office_name, address, pincode, phone, working_hours)
select id,'Passport','Hyderabad Passport Seva Kendra','Ameerpet, Hyderabad','500016','04033445566','9:00 AM - 4:00 PM' from states where state_code='TS';

insert into offices (state_id, department, office_name, address, pincode, phone, working_hours)
select id,'Municipal','Pune Municipal Office','Shivajinagar, Pune','411005','02025501111','10:00 AM - 6:00 PM' from states where state_code='MH';

insert into offices (state_id, department, office_name, address, pincode, phone, working_hours)
select id,'Hospital','AIIMS Delhi OPD','Ansari Nagar, Delhi','110029','01126588500','8:00 AM - 2:00 PM' from states where state_code='DL';

-- Tokens (Smart Insert to link Office ID)
INSERT INTO tokens (token_number, office_id, office_name, appointment_date, appointment_time, status, service_name)
SELECT 
  'KA-RTO-240315-001', id, office_name, current_date, '10:00', 'pending', 'Driving License Test'
FROM offices WHERE office_name = 'Bangalore Central RTO';

INSERT INTO tokens (token_number, office_id, office_name, appointment_date, appointment_time, status, service_name)
SELECT 
  'KA-RTO-240315-002', id, office_name, current_date, '10:10', 'serving', 'Driving License Test'
FROM offices WHERE office_name = 'Bangalore Central RTO';

INSERT INTO tokens (token_number, office_id, office_name, appointment_date, appointment_time, status, service_name)
SELECT 
  'KA-RTO-240315-003', id, office_name, current_date, '10:20', 'completed', 'Vehicle Registration'
FROM offices WHERE office_name = 'Bangalore Central RTO';

-- Service Logs
insert into service_logs (office_id, service_name, duration_minutes)
select id,'Driving License Test',(10 + floor(random()*20))::int from offices;
