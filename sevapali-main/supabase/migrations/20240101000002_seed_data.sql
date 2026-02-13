-- Seed Offices
INSERT INTO offices (id, name, address) VALUES
('rto-pune', 'RTO Pune', 'Sangam Bridge, Pune'),
('rto-mumbai', 'RTO Mumbai', 'Andheri East, Mumbai'),
('tahsil-pune', 'Tahsil Office Pune', 'Shivajinagar, Pune'),
('hospital-pune', 'Sassoon Hospital', 'Sassoon Road, Pune'),
('municipal-pune', 'Pune Municipal Corp', 'PMC Building, Pune')
ON CONFLICT (id) DO NOTHING;

-- Seed Services
INSERT INTO services (id, office_id, name, duration) VALUES
-- RTO Pune
('vehicle-reg', 'rto-pune', 'Vehicle Registration', 30),
('license', 'rto-pune', 'Driving License', 20),
('transfer', 'rto-pune', 'Vehicle Transfer', 25),
-- RTO Mumbai
('vehicle-reg-mum', 'rto-mumbai', 'Vehicle Registration', 30), -- Modified ID to be unique
('license-mum', 'rto-mumbai', 'Driving License', 20),
-- Tahsil Pune
('7-12', 'tahsil-pune', '7/12 Extract', 15),
('income-cert', 'tahsil-pune', 'Income Certificate', 20),
('domicile', 'tahsil-pune', 'Domicile Certificate', 20),
-- Hospital Pune
('opd', 'hospital-pune', 'OPD Consultation', 15),
('report', 'hospital-pune', 'Report Collection', 10),
-- Municipal Pune
('birth-cert', 'municipal-pune', 'Birth Certificate', 20),
('property-tax', 'municipal-pune', 'Property Tax', 15)
ON CONFLICT (id) DO NOTHING;

-- Seed Schemes
INSERT INTO schemes (name, description, eligibility, benefits, category, apply_link, is_new) VALUES
('Mahatma Phule Jan Arogya Yojana', 'Free health insurance for poor families. Free treatment for 971 types of diseases.', 'Annual income less than ₹1.5 lakh, Yellow/Orange ration card holders', '₹1.5 Lakh coverage per family per year', 'health', 'https://www.jeevandayee.gov.in/', true),
('Lek Ladki Yojana', 'Financial assistance from birth to 18 years for girls. Encouragement for education.', 'Girls from Maharashtra, Yellow/Orange ration card families', '₹1,01,000 total (given in installments)', 'women', 'https://womenchild.maharashtra.gov.in/', true),
('PM Kisan Samman Nidhi', 'Annual financial assistance of ₹6,000 to farmers in three installments.', 'Registered farmers with land ownership', '₹6,000/year in 3 installments', 'agriculture', 'https://pmkisan.gov.in/', false),
('PM Awas Yojana (Rural)', 'Financial assistance for building pucca houses for poor families in rural areas.', 'Homeless families, families with kutcha houses, priority to SC/ST/OBC families', '₹1,20,000 - ₹1,30,000 for house construction', 'housing', 'https://pmayg.nic.in/', false),
('CM Employment Generation Program', 'Loans and subsidies for youth to start their own business.', 'Age 18-45 years, educational qualification 8th pass', 'Loan up to ₹50 Lakh with 25-35% subsidy', 'employment', 'https://maha-cmegp.gov.in/', true),
('Rajarshi Shahu Maharaj Scholarship', 'Scholarship for higher education for OBC students.', 'OBC students, annual income less than ₹8 lakh', '100% tuition fee reimbursement', 'education', 'https://mahadbt.maharashtra.gov.in/', false),
('Ayushman Bharat Yojana', 'Free health insurance of ₹5 lakh for poor and vulnerable families.', 'Families eligible as per SECC 2011 data', '₹5 Lakh health cover per family per year', 'health', 'https://pmjay.gov.in/', false),
('Majhi Kanya Bhagyashree Yojana', 'Financial assistance for education and marriage of girls.', 'Families with one or two girls, annual income less than ₹7.5 lakh', '₹50,000 at maturity', 'women', 'https://womenchild.maharashtra.gov.in/', false),
('Farmer Accident Insurance Scheme', 'Accident insurance coverage for farmers.', 'Registered farmers aged 10-75 years', '₹2 Lakh accident cover', 'agriculture', 'https://krishi.maharashtra.gov.in/', false),
('Dr. Punjabrao Deshmukh Hostel Scheme', 'Free hostel facility for rural students.', 'Students from rural areas pursuing higher education', 'Free accommodation + maintenance allowance', 'education', 'https://mahadbt.maharashtra.gov.in/', true),
('Gharkul Yojana', 'Housing construction scheme for rural poor.', 'Homeless families, Below Poverty Line families', '₹1,20,000 for house construction', 'housing', 'https://rhreporting.nic.in/', false),
('Women Self-Employment Scheme', 'Loans and training for women for self-employment.', 'Women aged 18-55 years, Maharashtra resident', 'Loan up to ₹3 Lakh with subsidy', 'women', 'https://www.mahaswayamroj.gov.in/', true);
