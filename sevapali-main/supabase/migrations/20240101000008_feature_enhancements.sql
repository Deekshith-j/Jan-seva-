-- FEATURE ENHANCEMENTS: Documents, Queue Logic, & Verification

BEGIN;

-- 1. SCHEMA UPDATES
-- Add required_documents to services
ALTER TABLE public.services 
ADD COLUMN required_documents TEXT[];

-- Add document_urls and is_verified to tokens
ALTER TABLE public.tokens 
ADD COLUMN document_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- 2. UPDATE TRIGGER LOGIC (handle_new_token)
-- Original logic assigned position_in_queue on INSERT.
-- New logic: ONLY generate token_number. Position is assigned at CHECK-IN.

CREATE OR REPLACE FUNCTION public.handle_new_token()
RETURNS TRIGGER AS $$
DECLARE
  v_office_code TEXT;
  v_seq INTEGER;
BEGIN
  -- Generate Token Number if missing
  IF new.token_number IS NULL OR new.token_number = '' THEN
    -- Get a short code for the office (using first 3 chars of ID for simplicity)
    v_office_code := SUBSTRING(new.office_id FROM 1 FOR 3);
    
    -- Get daily sequence for THIS OFFICE
    SELECT count(*) + 1 INTO v_seq
    FROM public.tokens
    WHERE office_id = new.office_id AND appointment_date = new.appointment_date;
    
    new.token_number := UPPER(v_office_code) || '-' || TO_CHAR(new.appointment_date, 'DDMM') || '-' || LPAD(v_seq::text, 3, '0');
  END IF;

  -- Ensure status is 'pending' initially
  new.status := 'pending';
  -- Ensure position is NULL initially
  new.position_in_queue := NULL;
  new.estimated_wait_minutes := NULL;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE RPC (scan_token) -> NOW "check_in_token" logic
-- Logic: Verify token -> If valid -> Assign Queue Position -> Update Status
-- Note: We keep the name scan_token for backward compatibility but update internal logic.

CREATE OR REPLACE FUNCTION public.scan_token(p_token_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_token RECORD;
  v_queue_pos INTEGER;
  v_wait_time INTEGER;
BEGIN
  -- Find the token
  SELECT * INTO v_token
  FROM public.tokens
  WHERE token_number = p_token_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token not found');
  END IF;

  -- Check if date matches today
  IF v_token.appointment_date != CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'message', 'Token is not for today');
  END IF;

  -- Handle statuses
  IF v_token.status = 'pending' THEN
    -- CALCULATE QUEUE POSITION NOW
    SELECT count(*) + 1 INTO v_queue_pos
    FROM public.tokens
    WHERE office_id = v_token.office_id
      AND appointment_date = CURRENT_DATE
      AND status IN ('waiting', 'serving');

    -- ESTIMATE WAIT TIME (Simple logic: 15 mins * position)
    -- In future, AI can override this or we use avg service time
    v_wait_time := v_queue_pos * 15;

    -- Update token
    UPDATE public.tokens 
    SET 
      status = 'waiting', 
      position_in_queue = v_queue_pos,
      estimated_wait_minutes = v_wait_time,
      updated_at = NOW() 
    WHERE id = v_token.id;
    
    -- Refetch to return updated data
    SELECT * INTO v_token FROM public.tokens WHERE id = v_token.id;

    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Checked in successfully. Logic: Added to queue.', 
      'token', v_token
    );

  ELSIF v_token.status = 'waiting' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already checked in', 'token', v_token);
  ELSIF v_token.status = 'serving' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Currently being served', 'token', v_token);
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Token is ' || v_token.status);
  END IF;
END;
$$;

COMMIT;
