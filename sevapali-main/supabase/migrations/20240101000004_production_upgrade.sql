-- UPGRADE TO PRODUCTION SCHEMA
-- Adds Pan-India structure, Counters, and Daily Limits

BEGIN;

-- 1. PAN-INDIA STRUCTURE
CREATE TABLE public.states (
    id TEXT PRIMARY KEY, -- e.g., 'MH'
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.districts (
    id TEXT PRIMARY KEY, -- e.g., 'MH-PUNE'
    state_id TEXT REFERENCES public.states(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Offices to link to District
ALTER TABLE public.offices ADD COLUMN district_id TEXT REFERENCES public.districts(id);

-- 2. DEPARTMENTS & COUNTERS
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    office_id TEXT REFERENCES public.offices(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., 'License Section', 'Registration Section'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.counters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    office_id TEXT REFERENCES public.offices(id) ON DELETE CASCADE NOT NULL,
    department_id UUID REFERENCES public.departments(id), 
    name TEXT NOT NULL, -- e.g., 'Counter 1', 'Counter 2'
    details TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Services to belong to a Department (optional, can be null for general office services)
ALTER TABLE public.services ADD COLUMN department_id UUID REFERENCES public.departments(id);

-- Update Tokens to be assigned to a Counter
ALTER TABLE public.tokens ADD COLUMN counter_id UUID REFERENCES public.counters(id);
ALTER TABLE public.tokens ADD COLUMN completed_at TIMESTAMPTZ;

-- 3. DAILY LIMITS & CONTROLS
CREATE TABLE public.daily_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    office_id TEXT REFERENCES public.offices(id) ON DELETE CASCADE NOT NULL,
    service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE, -- Null means office-wide limit
    date DATE NOT NULL,
    max_tokens INTEGER NOT NULL,
    current_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(office_id, service_id, date)
);

-- 4. LOGGING & AUDIT
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scheme_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    scheme_id INTEGER REFERENCES public.schemes(id),
    eligible BOOLEAN NOT NULL,
    reason TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS POLICIES
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_verifications ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "States are public" ON public.states FOR SELECT USING (true);
CREATE POLICY "Districts are public" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Departments are public" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Counters are public" ON public.counters FOR SELECT USING (true);

-- Daily Limits: Public Read, Official Write
CREATE POLICY "Daily limits public view" ON public.daily_limits FOR SELECT USING (true);
CREATE POLICY "Officials manage daily limits" ON public.daily_limits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);

-- Verification Logs: User view own, Official view all
CREATE POLICY "Users view own verifications" ON public.scheme_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officials view all verifications" ON public.scheme_verifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('official', 'admin'))
);
-- Allow insert from backend (service role) or potentially authenticated user via function
CREATE POLICY "Users insert verification" ON public.scheme_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit Logs: Insert only, Admin view
CREATE POLICY "System inserts logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 6. INDEXES for Performance
CREATE INDEX idx_tokens_date_office ON public.tokens(office_id, appointment_date);
CREATE INDEX idx_tokens_status ON public.tokens(status);
CREATE INDEX idx_districts_state ON public.districts(state_id);

COMMIT;
