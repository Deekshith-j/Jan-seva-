
-- Add office_id to profiles to link officials to specific offices
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS office_id TEXT REFERENCES public.offices(id);

-- Optional: Index for performance
CREATE INDEX idx_profiles_office_id ON public.profiles(office_id);
