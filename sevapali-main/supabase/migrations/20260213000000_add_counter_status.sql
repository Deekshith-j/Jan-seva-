-- Add counter status to profiles for AI prediction and queue management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active_counter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_counter_number TEXT;

-- Update RLS to allow officials to update their own active status
-- Existing policy "Users can update own profile" should cover it: USING (auth.uid() = id)
