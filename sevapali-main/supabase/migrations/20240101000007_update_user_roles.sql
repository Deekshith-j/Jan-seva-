-- Add office_id to user_roles to link officials to their office
ALTER TABLE public.user_roles 
ADD COLUMN office_id TEXT REFERENCES public.offices(id);

-- Update RLS to allow officials to view their office's data (optional, but good practice)
-- (Existing policies often check just for 'official' role, effectively giving access to all data or filtered by app logic. 
-- For strict security, we'd update policies to check office_id match, but for now we rely on the app passing the correct office_id to RPCs)
