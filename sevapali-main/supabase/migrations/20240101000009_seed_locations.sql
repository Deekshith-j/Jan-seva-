-- Seed States and Union Territories
INSERT INTO states (id, name, code) VALUES
('AP', 'Andhra Pradesh', 'AP'),
('AR', 'Arunachal Pradesh', 'AR'),
('AS', 'Assam', 'AS'),
('BR', 'Bihar', 'BR'),
('CG', 'Chhattisgarh', 'CG'),
('GA', 'Goa', 'GA'),
('GJ', 'Gujarat', 'GJ'),
('HR', 'Haryana', 'HR'),
('HP', 'Himachal Pradesh', 'HP'),
('JH', 'Jharkhand', 'JH'),
('KA', 'Karnataka', 'KA'),
('KL', 'Kerala', 'KL'),
('MP', 'Madhya Pradesh', 'MP'),
('MH', 'Maharashtra', 'MH'),
('MN', 'Manipur', 'MN'),
('ML', 'Meghalaya', 'ML'),
('MZ', 'Mizoram', 'MZ'),
('NL', 'Nagaland', 'NL'),
('OR', 'Odisha', 'OR'),
('PB', 'Punjab', 'PB'),
('RJ', 'Rajasthan', 'RJ'),
('SK', 'Sikkim', 'SK'),
('TN', 'Tamil Nadu', 'TN'),
('TG', 'Telangana', 'TG'),
('TR', 'Tripura', 'TR'),
('UP', 'Uttar Pradesh', 'UP'),
('UK', 'Uttarakhand', 'UK'),
('WB', 'West Bengal', 'WB'),
('AN', 'Andaman and Nicobar Islands', 'AN'),
('CH', 'Chandigarh', 'CH'),
('DN', 'Dadra and Nagar Haveli and Daman and Diu', 'DN'),
('DL', 'Delhi', 'DL'),
('JK', 'Jammu and Kashmir', 'JK'),
('LA', 'Ladakh', 'LA'),
('LD', 'Lakshadweep', 'LD'),
('PY', 'Puducherry', 'PY')
ON CONFLICT (id) DO NOTHING;

-- Seed Major Districts (Capitals/Major Cities) for demonstration
-- Note: A full list of 700+ districts is too large for this seed. Adding major ones.
INSERT INTO districts (id, state_id, name, code) VALUES
('MH-PN', 'MH', 'Pune', 'PN'),
('MH-MB', 'MH', 'Mumbai', 'MB'),
('MH-NG', 'MH', 'Nagpur', 'NG'),
('DL-ND', 'DL', 'New Delhi', 'ND'),
('KA-BL', 'KA', 'Bengaluru', 'BL'),
('TN-CH', 'TN', 'Chennai', 'CH'),
('WB-KO', 'WB', 'Kolkata', 'KO'),
('TG-HY', 'TG', 'Hyderabad', 'HY'),
('GJ-AH', 'GJ', 'Ahmedabad', 'AH'),
('RJ-JA', 'RJ', 'Jaipur', 'JA'),
('UP-LU', 'UP', 'Lucknow', 'LU'),
('KL-TV', 'KL', 'Thiruvananthapuram', 'TV')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Offices in these districts
-- We will create generic offices for RTO, Municipal, etc. in these major cities
INSERT INTO offices (id, name, address, district_id) VALUES
('rto-pune', 'RTO Pune', 'Sangam Bridge, Pune', 'MH-PN'),
('rto-mumbai', 'RTO Mumbai', 'Andheri West, Mumbai', 'MH-MB'),
('rto-delhi', 'RTO Delhi', 'Sarai Kale Khan, Delhi', 'DL-ND'),
('rto-blr', 'RTO Bengaluru', 'Indiranagar, Bengaluru', 'KA-BL'),
('rto-chennai', 'RTO Chennai', 'KK Nagar, Chennai', 'TN-CH'),
('rto-kolkata', 'RTO Kolkata', 'Beltala, Kolkata', 'WB-KO'),
('rto-hyd', 'RTO Hyderabad', 'Khairatabad, Hyderabad', 'TG-HY'),

('mc-pune', 'Pune Municipal Corporation', 'Shivajinagar, Pune', 'MH-PN'),
('bmc-mumbai', 'Brihanmumbai Municipal Corp', 'Fort, Mumbai', 'MH-MB'),
('ndmc-delhi', 'New Delhi Municipal Council', 'Palika Kendra, Delhi', 'DL-ND'),
('bbmp-blr', 'Bruhat Bengaluru Mahanagara Palike', 'Hudson Circle, Bengaluru', 'KA-BL'),

('civic-pune', 'District Hospital Pune', 'Aundh, Pune', 'MH-PN'),
('aiims-delhi', 'AIIMS Delhi', 'Ansari Nagar, Delhi', 'DL-ND'),
('apollo-chennai', 'Government General Hospital', 'Park Town, Chennai', 'TN-CH')
ON CONFLICT (id) DO UPDATE SET district_id = EXCLUDED.district_id;

-- Seed Services for these offices
-- We'll link common services to these new offices
INSERT INTO services (id, office_id, name, duration) VALUES
-- RTO Services
('dl-pune', 'rto-pune', 'Driving License', 30),
('rc-pune', 'rto-pune', 'Vehicle Registration', 45),
('dl-delhi', 'rto-delhi', 'Driving License', 30),
('rc-delhi', 'rto-delhi', 'Vehicle Registration', 45),
('dl-blr', 'rto-blr', 'Driving License', 30),
('rc-blr', 'rto-blr', 'Vehicle Registration', 45),

-- Municipal Services
('tax-pune', 'mc-pune', 'Property Tax Payment', 20),
('birth-pune', 'mc-pune', 'Birth Certificate', 15),
('tax-delhi', 'ndmc-delhi', 'Property Tax Payment', 20),
('birth-delhi', 'ndmc-delhi', 'Birth Certificate', 15),

-- Hospital Services
('opd-pune', 'civic-pune', 'General OPD', 10),
('opd-delhi', 'aiims-delhi', 'General OPD', 15)
ON CONFLICT (id) DO NOTHING;
