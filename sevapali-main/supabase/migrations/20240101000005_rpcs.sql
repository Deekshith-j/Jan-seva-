-- RPC Shortcuts for Critical Business Logic

BEGIN;

-- 1. SCAN TOKEN (QR Check-in)
-- Verifies token validity for TODAY and updates status to 'waiting' (Checked In)
CREATE OR REPLACE FUNCTION public.scan_token(p_token_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_token RECORD;
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

  -- Update status if pending
  IF v_token.status = 'pending' THEN
    UPDATE public.tokens 
    SET status = 'waiting', updated_at = NOW() 
    WHERE id = v_token.id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Checked in successfully', 'token', v_token);
  ELSIF v_token.status = 'waiting' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already checked in', 'token', v_token);
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Token is ' || v_token.status);
  END IF;
END;
$$;

-- 2. ASSIGN COUNTER
CREATE OR REPLACE FUNCTION public.assign_counter(p_token_id UUID, p_counter_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tokens
  SET counter_id = p_counter_id, updated_at = NOW()
  WHERE id = p_token_id;
END;
$$;

-- 3. GET ANALYTICS (Aggregated stats for Dashboard)
CREATE OR REPLACE FUNCTION public.get_analytics(p_office_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_served INTEGER;
  v_waiting INTEGER;
  v_avg_wait NUMERIC;
  v_hourly JSONB;
  v_service_dist JSONB;
BEGIN
  -- Stats for TODAY
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status IN ('waiting', 'serving'))
  INTO v_total, v_served, v_waiting
  FROM public.tokens
  WHERE office_id = p_office_id AND appointment_date = CURRENT_DATE;

  -- Calc Avg Wait (Completed tokens today)
  SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (served_at - created_at))/60)::numeric, 1), 0)
  INTO v_avg_wait
  FROM public.tokens
  WHERE office_id = p_office_id 
    AND appointment_date = CURRENT_DATE 
    AND status = 'completed'
    AND served_at IS NOT NULL;

  -- Hourly Distribution (Today)
  SELECT jsonb_agg(jsonb_build_object('hour', h, 'count', c))
  INTO v_hourly
  FROM (
    SELECT EXTRACT(HOUR FROM created_at) as h, COUNT(*) as c
    FROM public.tokens
    WHERE office_id = p_office_id AND appointment_date = CURRENT_DATE
    GROUP BY 1 ORDER BY 1
  ) t;

  -- Service Distribution (Today)
  SELECT jsonb_agg(jsonb_build_object('name', service_name, 'value', c))
  INTO v_service_dist
  FROM (
    SELECT service_name, COUNT(*) as c
    FROM public.tokens
    WHERE office_id = p_office_id AND appointment_date = CURRENT_DATE
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'total', v_total,
    'served', v_served,
    'waiting', v_waiting,
    'avg_wait', v_avg_wait,
    'hourly', COALESCE(v_hourly, '[]'::jsonb),
    'services', COALESCE(v_service_dist, '[]'::jsonb)
  );
END;
$$;

COMMIT;
