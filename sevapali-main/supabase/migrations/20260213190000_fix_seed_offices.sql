-- Migration: 20260213190000_fix_seed_offices.sql
-- Description: Insert missing districts/cities and link orphaned offices to them.

DO $$
DECLARE
  ka_id uuid;
  mh_id uuid;
  ts_id uuid;
  dl_id uuid;
  
  blr_dist_id uuid;
  pune_dist_id uuid;
  hyd_dist_id uuid;
  del_dist_id uuid;
  
  blr_city_id uuid;
  pune_city_id uuid;
  hyd_city_id uuid;
  del_city_id uuid;
BEGIN
  -- 1. Get State IDs
  SELECT id INTO ka_id FROM states WHERE state_code='KA';
  SELECT id INTO mh_id FROM states WHERE state_code='MH';
  SELECT id INTO ts_id FROM states WHERE state_code='TS';
  SELECT id INTO dl_id FROM states WHERE state_code='DL';

  -- 2. Ensure Districts Exist and Get IDs
  -- Bengaluru Urban
  INSERT INTO districts (state_id, district_name) VALUES (ka_id, 'Bengaluru Urban')
  ON CONFLICT DO NOTHING; -- No unique constraint usually, but let's assume strict insert or select
  SELECT id INTO blr_dist_id FROM districts WHERE state_id=ka_id AND district_name='Bengaluru Urban';
  
  -- Pune
  INSERT INTO districts (state_id, district_name) VALUES (mh_id, 'Pune')
  ON CONFLICT DO NOTHING;
  SELECT id INTO pune_dist_id FROM districts WHERE state_id=mh_id AND district_name='Pune';
  
  -- Hyderabad
  INSERT INTO districts (state_id, district_name) VALUES (ts_id, 'Hyderabad')
  ON CONFLICT DO NOTHING;
  SELECT id INTO hyd_dist_id FROM districts WHERE state_id=ts_id AND district_name='Hyderabad';
  
  -- New Delhi
  INSERT INTO districts (state_id, district_name) VALUES (dl_id, 'New Delhi')
  ON CONFLICT DO NOTHING;
  SELECT id INTO del_dist_id FROM districts WHERE state_id=dl_id AND district_name='New Delhi';

  -- 3. Ensure Cities Exist and Get IDs
  -- Bengaluru
  INSERT INTO cities (district_id, city_name) VALUES (blr_dist_id, 'Bengaluru')
  ON CONFLICT DO NOTHING;
  SELECT id INTO blr_city_id FROM cities WHERE district_id=blr_dist_id AND city_name='Bengaluru';
  
  -- Pune
  INSERT INTO cities (district_id, city_name) VALUES (pune_dist_id, 'Pune')
  ON CONFLICT DO NOTHING;
  SELECT id INTO pune_city_id FROM cities WHERE district_id=pune_dist_id AND city_name='Pune';
  
  -- Hyderabad
  INSERT INTO cities (district_id, city_name) VALUES (hyd_dist_id, 'Hyderabad')
  ON CONFLICT DO NOTHING;
  SELECT id INTO hyd_city_id FROM cities WHERE district_id=hyd_dist_id AND city_name='Hyderabad';
  
  -- New Delhi
  INSERT INTO cities (district_id, city_name) VALUES (del_dist_id, 'New Delhi')
  ON CONFLICT DO NOTHING;
  SELECT id INTO del_city_id FROM cities WHERE district_id=del_dist_id AND city_name='New Delhi';

  -- 4. Update Offices
  -- Bangalore Central RTO
  UPDATE offices 
  SET district_id = blr_dist_id, city_id = blr_city_id 
  WHERE office_name = 'Bangalore Central RTO';

  -- Hyderabad Passport Seva Kendra
  UPDATE offices 
  SET district_id = hyd_dist_id, city_id = hyd_city_id 
  WHERE office_name = 'Hyderabad Passport Seva Kendra';

  -- Pune Municipal Office
  UPDATE offices 
  SET district_id = pune_dist_id, city_id = pune_city_id 
  WHERE office_name = 'Pune Municipal Office';

  -- AIIMS Delhi OPD
  UPDATE offices 
  SET district_id = del_dist_id, city_id = del_city_id 
  WHERE office_name = 'AIIMS Delhi OPD';
  
  RAISE NOTICE 'Fixed missing location data for 4 major offices.';
END $$;
