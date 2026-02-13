-- Migration: 20260213160500_seed_realistic_data.sql
-- Description: Apply Realistic Demo Data (Citizens, Bookings, Notifications, Feedback, Analytics)

-- 1. CREATE SUPPORTING TABLES (If not exist)
-- 1. CREATE SUPPORTING TABLES (If not exist) & Ensure Columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY -- minimal create if missing entirely
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  category TEXT,
  subject TEXT,
  message TEXT,
  rating INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public access policies for demo purposes
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public read feedback" ON feedback FOR SELECT USING (true);

-- 2. INSERT DEMO USERS (Profiles)
insert into profiles (id, full_name, phone_number, city, language_preference)
values
(gen_random_uuid(),'Ravi Kumar','9876543210','Bengaluru','en'),
(gen_random_uuid(),'Sita Devi','9123456780','Hyderabad','hi'),
(gen_random_uuid(),'Arjun Reddy','9012345678','Hyderabad','te'),
(gen_random_uuid(),'Meena Krishnan','9988776655','Chennai','ta'),
(gen_random_uuid(),'Rahul Sharma','9090909090','Delhi','hi'),
(gen_random_uuid(),'Priya Patil','8887776665','Pune','mr'),
(gen_random_uuid(),'Joseph Mathew','8899001122','Kochi','ml'),
(gen_random_uuid(),'Harpreet Singh','9776655443','Chandigarh','pa'),
(gen_random_uuid(),'Amit Das','9665544332','Kolkata','bn'),
(gen_random_uuid(),'Lakshmi Narayan','9554433221','Bengaluru','kn');

-- 3. GENERATE BOOKINGS (Tokens)
-- Using 'Bangalore Central RTO' (ensure this office exists from previous seed)
insert into tokens
(token_number, office_id, department, office_name, service_name, appointment_date, appointment_time, status, estimated_wait_minutes)
select
  'KA-RTO-'||to_char(current_date,'YYMMDD')||'-'||lpad((row_number() over())::text,3,'0'),
  (select id from offices where office_name='Bangalore Central RTO' limit 1),
  'RTO', -- Mapped from 'office_type'
  'Bangalore Central RTO',
  (case when random()<0.5 then 'Driving License Test' else 'Vehicle Registration' end),
  current_date,
  (time '09:00' + (row_number() over()* interval '7 minutes'))::text,
  (case
   when random()<0.65 then 'completed'
   when random()<0.85 then 'pending'
   else 'cancelled'
  end),
  (5 + floor(random()*45))::int
from generate_series(1,120);

-- 4. UPDATE QUEUE POSITION
update tokens
set position_in_queue = sub.pos
from (
  select id, row_number() over(order by appointment_time) as pos
  from tokens
  where status='pending'
) sub
where tokens.id=sub.id;

-- 5. NOTIFICATIONS
insert into notifications (user_id,type,title,message,is_read)
select
profiles.id,
'token_update',
'Your turn is approaching',
'Please reach the office within 15 minutes',
(random()<0.4)
from profiles
cross join generate_series(1,2);

-- 6. FEEDBACK
insert into feedback (user_id,category,subject,message,rating,status)
select
id,
(case when random()<0.3 then 'staff'
      when random()<0.6 then 'facilities'
      else 'service_quality' end),
'Service Experience',
(case when random()<0.5
      then 'Process was smooth and quick'
      else 'Waiting time was slightly long' end),
(1 + floor(random()*5))::int,
(case when random()<0.5 then 'resolved' else 'acknowledged' end)
from profiles;

-- 7. HISTORICAL ANALYTICS (Service Logs)
insert into service_logs (office_id,service_name,duration_minutes,created_at)
select
  (select id from offices where office_name='Bangalore Central RTO' limit 1),
  (case when random()<0.5 then 'Driving License Test' else 'Vehicle Registration' end),
  (8 + floor(random()*25))::int,
  now() - (floor(random()*30)||' days')::interval
from generate_series(1,800);

-- 8. PEAK HOUR PATTERN
insert into service_logs (office_id,service_name,duration_minutes,created_at)
select
  (select id from offices where office_name='Bangalore Central RTO' limit 1),
  'Driving License Test',
  (12 + floor(random()*10))::int,
  date_trunc('day',now()) + interval '11 hour' + (random()*interval '1 hour')
from generate_series(1,150);
