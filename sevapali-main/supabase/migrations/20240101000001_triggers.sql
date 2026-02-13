-- Trigger to handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, phone)
  VALUES (new.id, new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::user_role, 'citizen'));
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to handle token creation logic (Queue position, token number)
CREATE OR REPLACE FUNCTION public.handle_new_token()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_wait_time INTEGER;
BEGIN
  -- 1. Generate Token Number if not provided or valid
  -- Format: {OFFICE}-{SERVICE}-{RANDOM}
  -- For simplicity, we keep the client generated one OR generate a simple one here.
  -- Let's trust the client for the "TK-" part but ensure uniqueness or append sequence?
  -- The frontend generates `TK-{Date.now().toString(36)}`.
  -- We will respect that but ensure position_in_queue is correct.

  -- 2. Calculate Position in Queue
  -- Count tokens for ANY service in this office that are 'waiting' or 'pending' or 'serving'
  SELECT count(*) INTO v_count
  FROM public.tokens
  WHERE office_id = new.office_id
    AND appointment_date = new.appointment_date
    AND status IN ('waiting', 'pending', 'serving');
    
  new.position_in_queue := v_count + 1;

  -- 3. Calculate Estimated Wait Time
  -- Simple logic: (Position * 15 minutes) / (Active Counters)
  -- Defaulting to 15 mins per token.
  v_wait_time := (v_count + 1) * 15;
  new.estimated_wait_minutes := v_wait_time;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_token_created
  BEFORE INSERT ON public.tokens
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_token();

-- Function to update queue positions when a token is completed/served
-- (Optional optimization: Re-calculate estimated wait time for others? 
--  For now, we leave it simple. Realtime subscription will handle the "refresh list" part.)
