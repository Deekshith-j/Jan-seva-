-- Migration: 20260213161000_seed_detailed_districts_services.sql
-- Description: Populate detailed Districts, Cities, and Services for Major States

-- A. POPULATE DISTRICTS (Selected States)

DO $$ 
DECLARE
  ka_id uuid;
  mh_id uuid;
  ts_id uuid;
  dl_id uuid;
  up_id uuid;
  tn_id uuid;
BEGIN
  -- Get State IDs
  SELECT id INTO ka_id FROM states WHERE state_code='KA';
  SELECT id INTO mh_id FROM states WHERE state_code='MH';
  SELECT id INTO ts_id FROM states WHERE state_code='TS';
  SELECT id INTO dl_id FROM states WHERE state_code='DL';
  SELECT id INTO up_id FROM states WHERE state_code='UP';
  SELECT id INTO tn_id FROM states WHERE state_code='TN';

  -- 1. KARNATAKA DISTRICTS
  INSERT INTO districts (state_id, district_name) VALUES 
  (ka_id, 'Bagalkot'), (ka_id, 'Ballari'), (ka_id, 'Belagavi'), (ka_id, 'Bengaluru Rural'), 
  (ka_id, 'Bidar'), (ka_id, 'Chamarajanagar'), (ka_id, 'Chikkaballapur'), (ka_id, 'Chikkamagaluru'), 
  (ka_id, 'Chitradurga'), (ka_id, 'Dakshina Kannada'), (ka_id, 'Davanagere'), (ka_id, 'Dharwad'), 
  (ka_id, 'Gadag'), (ka_id, 'Hassan'), (ka_id, 'Haveri'), (ka_id, 'Kalaburagi'), 
  (ka_id, 'Kodagu'), (ka_id, 'Kolar'), (ka_id, 'Koppal'), (ka_id, 'Mandya'), 
  (ka_id, 'Mysuru'), (ka_id, 'Raichur'), (ka_id, 'Ramanagara'), (ka_id, 'Shivamogga'), 
  (ka_id, 'Tumakuru'), (ka_id, 'Udupi'), (ka_id, 'Uttara Kannada'), (ka_id, 'Vijayapura'), 
  (ka_id, 'Yadgir')
  ON CONFLICT DO NOTHING; -- Assuming district_name + state_id unique constraint or strictly insert

  -- 2. MAHARASHTRA DISTRICTS
  INSERT INTO districts (state_id, district_name) VALUES 
  (mh_id, 'Ahmednagar'), (mh_id, 'Akola'), (mh_id, 'Amravati'), (mh_id, 'Aurangabad'), 
  (mh_id, 'Beed'), (mh_id, 'Bhandara'), (mh_id, 'Buldhana'), (mh_id, 'Chandrapur'), 
  (mh_id, 'Dhule'), (mh_id, 'Gadchiroli'), (mh_id, 'Gondia'), (mh_id, 'Hingoli'), 
  (mh_id, 'Jalgaon'), (mh_id, 'Jalna'), (mh_id, 'Kolhapur'), (mh_id, 'Latur'), 
  (mh_id, 'Mumbai City'), (mh_id, 'Mumbai Suburban'), (mh_id, 'Nagpur'), (mh_id, 'Nanded'), 
  (mh_id, 'Nandurbar'), (mh_id, 'Nashik'), (mh_id, 'Osmanabad'), (mh_id, 'Palghar'), 
  (mh_id, 'Parbhani'), (mh_id, 'Raigad'), (mh_id, 'Ratnagiri'), (mh_id, 'Sangli'), 
  (mh_id, 'Satara'), (mh_id, 'Sindhudurg'), (mh_id, 'Solapur'), (mh_id, 'Thane'), 
  (mh_id, 'Wardha'), (mh_id, 'Washim'), (mh_id, 'Yavatmal')
  ON CONFLICT DO NOTHING;

  -- 3. TELANGANA DISTRICTS
  INSERT INTO districts (state_id, district_name) VALUES 
  (ts_id, 'Adilabad'), (ts_id, 'Bhadradri Kothagudem'), (ts_id, 'Jagtial'), (ts_id, 'Jangaon'), 
  (ts_id, 'Jayashankar Bhupalpally'), (ts_id, 'Jogulamba Gadwal'), (ts_id, 'Kamareddy'), (ts_id, 'Karimnagar'), 
  (ts_id, 'Khammam'), (ts_id, 'Kumuram Bheem'), (ts_id, 'Mahabubabad'), (ts_id, 'Mahabubnagar'), 
  (ts_id, 'Mancherial'), (ts_id, 'Medak'), (ts_id, 'Medchal-Malkajgiri'), (ts_id, 'Mulugu'), 
  (ts_id, 'Nagarkurnool'), (ts_id, 'Nalgonda'), (ts_id, 'Narayanpet'), (ts_id, 'Nirmal'), 
  (ts_id, 'Nizamabad'), (ts_id, 'Peddapalli'), (ts_id, 'Rajanna Sircilla'), (ts_id, 'Rangareddy'), 
  (ts_id, 'Sangareddy'), (ts_id, 'Siddipet'), (ts_id, 'Suryapet'), (ts_id, 'Vikarabad'), 
  (ts_id, 'Wanaparthy'), (ts_id, 'Warangal'), (ts_id, 'Hanamkonda'), (ts_id, 'Yadadri Bhuvanagiri')
  ON CONFLICT DO NOTHING;
  
  -- 4. UTTAR PRADESH DISTRICTS (Selected Major)
  INSERT INTO districts (state_id, district_name) VALUES 
  (up_id, 'Agra'), (up_id, 'Aligarh'), (up_id, 'Ayodhya'), (up_id, 'Bareilly'), 
  (up_id, 'Ghaziabad'), (up_id, 'Gorakhpur'), (up_id, 'Jhansi'), (up_id, 'Kanpur Nagar'), 
  (up_id, 'Lucknow'), (up_id, 'Mathura'), (up_id, 'Meerut'), (up_id, 'Moradabad'), 
  (up_id, 'Noida (Gautam Buddha Nagar)'), (up_id, 'Prayagraj'), (up_id, 'Varanasi')
  ON CONFLICT DO NOTHING;

END $$;

-- B. POPULATE DETAILED SERVICES (Pan-India & State Specific Nuances handled via generic names)

INSERT INTO services (department, service_name, avg_duration_minutes, slot_capacity, priority_allowed, required_documents) VALUES
-- RTO (Expanded)
('RTO', 'International Driving Permit', 15, 20, true, '["DL", "Passport", "Visa"]'),
('RTO', 'Duplicate Driving License', 10, 30, true, '["FIR (if lost)", "Affidavit"]'),
('RTO', 'Change of Address in DL/RC', 15, 30, true, '["Address Proof", "Original DL/RC"]'),
('RTO', 'Hypothecation Termination', 20, 25, false, '["NOC from Bank", "Form 35"]'),

-- Municipal (Expanded)
('Municipal', 'Property Tax Assessment', 20, 40, false, '["Property Deeds", "Old Receipts"]'),
('Municipal', 'Trade License New/Renewal', 15, 50, true, '["Occupancy Cert", "ID Proof", "NOC"]'),
('Municipal', 'Building Plan Approval', 30, 10, false, '["Architect Plan", "Ownership Proof"]'),
('Municipal', 'Water Connection Application', 20, 20, false, '["Property Tax Receipt", "ID Proof"]'),
('Municipal', 'Marriage Registration', 25, 15, true, '["Wedding Card", "Photos", "ID Proofs"]'),

-- Revenue (Expanded - Land & Certificates)
('Revenue', 'Land Mutation (Name Change)', 25, 20, false, '["Sale Deed", "Affidavit", "EC"]'),
('Revenue', 'Encumbrance Certificate (EC)', 10, 60, true, '["Property Details"]'),
('Revenue', 'Certified Copy of Land Records (RoR)', 5, 100, true, '["Survey Number"]'),
('Revenue', 'Legal Heir Certificate', 20, 20, false, '["Death Certificate", "Affidavits"]'),
('Revenue', 'Solvency Certificate', 15, 20, false, '["Bank Statement", "Asset Valuation"]'),
('Revenue', 'OBC/SC/ST Certificate', 15, 50, true, '["School Cert", "Father''s Caste Cert"]'),

-- Police (Expanded)
('Police', 'PCC (Police Clearance Certificate)', 15, 40, true, '["Passport", "Address Proof"]'),
('Police', 'Lost Article Report', 10, 50, false, '["Invoice", "ID Proof"]'),
('Police', 'Tenant Verification', 12, 40, false, '["Tenant ID", "Photo", "Owner Details"]'),

-- Social Welfare
('Social Welfare', 'Old Age Pension Application', 20, 30, true, '["Age Proof", "Income Cert", "Bank Acct"]'),
('Social Welfare', 'Widow Pension Application', 20, 30, true, '["Death Cert of Husband", "Income Cert"]'),
('Social Welfare', 'Disability Card (UDID)', 15, 25, true, '["Medical Certificate", "Photo"]');

-- C. SAMPLE CITIES FOR NEW DISTRICTS (To make them usable in dropdowns)
-- We need at least one city per district to make it selectable if the UI enforces City selection.
-- Logic: Insert a city with same name as district for all districts just inserted.

DO $$ 
DECLARE
  dist_rec RECORD;
BEGIN
  FOR dist_rec IN SELECT id, district_name FROM districts WHERE id NOT IN (SELECT district_id FROM cities) LOOP
    INSERT INTO cities (district_id, city_name) VALUES (dist_rec.id, dist_rec.district_name);
  END LOOP;
END $$;
