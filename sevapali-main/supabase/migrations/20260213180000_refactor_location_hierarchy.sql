-- Migration: 20260213180000_refactor_location_hierarchy.sql
-- Description: Implement strict Location -> Department -> Service hierarchy

-- 1. DEPARTMENTS TABLE (Master List)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);


-- 2. SEED DEPARTMENTS (From known list)
INSERT INTO departments (code, name) VALUES
('RTO', 'RTO (Regional Transport Office)'),
('MUNICIPAL', 'Municipal Corporation'),
('PASSPORT', 'Passport Seva Kendra'),
('HOSPITAL', 'Government Hospital'),
('REVENUE', 'Revenue Department'),
('POLICE', 'Police Department'),
('ELECTRICITY', 'Electricity Board'),
('SOCIAL_WELFARE', 'Social Welfare Department')
ON CONFLICT (code) DO NOTHING;


-- 3. LINK OFFICES TO DEPARTMENTS
-- Add department_id column
ALTER TABLE offices ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Populate department_id based on text matching (Case insensitive)
UPDATE offices
SET department_id = d.id
FROM departments d
WHERE LOWER(offices.department) = LOWER(d.code) OR LOWER(offices.department) = LOWER(d.name)
OR (d.code = 'RTO' AND offices.department ILIKE '%RTO%')
OR (d.code = 'MUNICIPAL' AND offices.department ILIKE '%Municipal%')
OR (d.code = 'PASSPORT' AND offices.department ILIKE '%Passport%')
OR (d.code = 'HOSPITAL' AND offices.department ILIKE '%Hospital%')
OR (d.code = 'REVENUE' AND offices.department ILIKE '%Revenue%')
OR (d.code = 'POLICE' AND offices.department ILIKE '%Police%')
OR (d.code = 'ELECTRICITY' AND offices.department ILIKE '%Electricity%')
OR (d.code = 'SOCIAL_WELFARE' AND offices.department ILIKE '%Social%');


-- 4. LINK SERVICES TO DEPARTMENTS
-- Add department_id column
ALTER TABLE services ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Populate department_id based on text matching
UPDATE services
SET department_id = d.id
FROM departments d
WHERE LOWER(services.department) = LOWER(d.code) OR LOWER(services.department) = LOWER(d.name)
OR (d.code = 'RTO' AND services.department ILIKE '%RTO%')
OR (d.code = 'MUNICIPAL' AND services.department ILIKE '%Municipal%')
OR (d.code = 'PASSPORT' AND services.department ILIKE '%Passport%')
OR (d.code = 'HOSPITAL' AND services.department ILIKE '%Hospital%')
OR (d.code = 'REVENUE' AND services.department ILIKE '%Revenue%')
OR (d.code = 'POLICE' AND services.department ILIKE '%Police%')
OR (d.code = 'ELECTRICITY' AND services.department ILIKE '%Electricity%')
OR (d.code = 'SOCIAL_WELFARE' AND services.department ILIKE '%Social%');


-- 5. LINK SERVICES TO OFFICES (Many-to-Many? Or 1-to-Many?)
-- Prompt says "System loads services under that department... Available slots depend on specific office counters".
-- Currently services are generic templates. We need to know WHICH office offers WHICH service.
-- For now, we assume ALL offices of a Department offer ALL services of that Department.
-- But we can add a mapping table `office_services` for finer control later.
-- We will add `office_id` to `services` as nullable to allow office-specific overrides, 
-- but for now rely on `department_id` match.


-- 6. COUNTERS TABLE (For managing slots/queues per office)
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) NOT NULL,
  department_id UUID REFERENCES departments(id), -- Optional denormalization
  code TEXT NOT NULL, -- "C1", "C2"
  name TEXT, -- "General Enquiry", "Driving Test Track 1"
  is_active BOOLEAN DEFAULT true,
  current_token_id UUID, -- For real-time status
  served_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read counters" ON counters FOR SELECT USING (true);


-- 7. SEED COUNTERS (Sample)
-- Create 2 counters for each office
INSERT INTO counters (office_id, code, name)
SELECT id, 'C1', 'General Counter' FROM offices;

INSERT INTO counters (office_id, code, name)
SELECT id, 'C2', 'Special Counter' FROM offices;


-- 8. UPDATE PROFILES (For Officials)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_office_id UUID REFERENCES offices(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_department_id UUID REFERENCES departments(id);
