-- Trigger to generate Token Number if missing
CREATE OR REPLACE FUNCTION public.handle_new_token()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_office_code TEXT;
  v_seq INTEGER;
BEGIN
  -- 1. Calculate Queue Position (Existing Logic)
  SELECT count(*) INTO v_count
  FROM public.tokens
  WHERE office_id = new.office_id
    AND appointment_date = new.appointment_date
    AND status IN ('waiting', 'pending', 'serving');
    
  new.position_in_queue := v_count + 1;
  new.estimated_wait_minutes := (v_count + 1) * 15;

  -- 2. Generate Token Number if missing
  IF new.token_number IS NULL OR new.token_number = '' THEN
    -- Get a short code for the office (using first 3 chars of ID for simplicity, or fetching from office table if we added a code column)
    -- For now, generic logic: T-OfficeSuffix-Seq
    v_office_code := SUBSTRING(new.office_id FROM 1 FOR 3);
    
    -- Get daily sequence
    SELECT count(*) + 1 INTO v_seq
    FROM public.tokens
    WHERE office_id = new.office_id AND appointment_date = new.appointment_date;
    
    new.token_number := UPPER(v_office_code) || '-' || TO_CHAR(new.appointment_date, 'DDMM') || '-' || LPAD(v_seq::text, 3, '0');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
