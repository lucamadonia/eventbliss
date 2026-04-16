-- ============================================
-- Manual bookings: agencies can create bookings directly (phone-in, walk-in, internal)
-- ============================================

-- 1. Allow NULL customer_id for manual bookings (no platform user needed)
ALTER TABLE public.marketplace_bookings
  ALTER COLUMN customer_id DROP NOT NULL;

-- 2. Track booking source + manual flag
ALTER TABLE public.marketplace_bookings
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'marketplace'
    CHECK (source IN ('marketplace', 'manual', 'import'));

-- 3. Allow assigning a team member (in addition to the guide)
ALTER TABLE public.marketplace_bookings
  ADD COLUMN IF NOT EXISTS assigned_team_member_id UUID
    REFERENCES public.agency_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mkt_bookings_assigned_team_member
  ON public.marketplace_bookings(assigned_team_member_id)
  WHERE assigned_team_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mkt_bookings_is_manual
  ON public.marketplace_bookings(is_manual)
  WHERE is_manual = true;

COMMENT ON COLUMN public.marketplace_bookings.is_manual IS
  'true = agency created this booking directly (phone-in / walk-in / internal). Skips Stripe payment flow.';

COMMENT ON COLUMN public.marketplace_bookings.source IS
  'marketplace = customer booked via public marketplace; manual = agency created; import = bulk imported';

COMMENT ON COLUMN public.marketplace_bookings.assigned_team_member_id IS
  'Optional: agency team member responsible for this booking (different from guide).';

-- 4. Helper view for booking calendar: enrich with service info + guide/member names
CREATE OR REPLACE VIEW public.agency_booking_calendar AS
SELECT
  b.id,
  b.agency_id,
  b.service_id,
  COALESCE(st.title, s.slug) AS service_title,
  s.category AS service_category,
  b.booking_number,
  b.booking_date,
  b.booking_time,
  b.participant_count,
  b.status,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.total_price_cents,
  b.agency_payout_cents,
  b.is_manual,
  b.source,
  b.assigned_guide_id,
  g.name AS assigned_guide_name,
  b.assigned_team_member_id,
  m.email AS assigned_team_member_email,
  m.role AS assigned_team_member_role,
  b.customer_notes,
  b.agency_notes,
  b.created_at
FROM public.marketplace_bookings b
LEFT JOIN public.marketplace_services s ON s.id = b.service_id
LEFT JOIN public.marketplace_service_translations st
  ON st.service_id = b.service_id AND st.locale = 'de'
LEFT JOIN public.agency_guides g ON g.id = b.assigned_guide_id
LEFT JOIN public.agency_members m ON m.id = b.assigned_team_member_id;

GRANT SELECT ON public.agency_booking_calendar TO authenticated;

-- 5. Helper function: create a manual booking without going through Stripe
CREATE OR REPLACE FUNCTION public.create_manual_booking(
  p_agency_id UUID,
  p_service_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_participant_count INT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_assigned_guide_id UUID DEFAULT NULL,
  p_assigned_team_member_id UUID DEFAULT NULL,
  p_unit_price_cents INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_booking_number TEXT;
  v_service RECORD;
  v_unit_price INT;
  v_total_price INT;
  v_commission_rate NUMERIC;
  v_platform_fee INT;
  v_agency_payout INT;
BEGIN
  -- Ownership check: caller must own this agency
  IF NOT EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = p_agency_id AND owner_id = auth.uid()
  ) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to create bookings for this agency';
  END IF;

  -- Load service + validate agency owns it
  SELECT * INTO v_service
  FROM public.marketplace_services
  WHERE id = p_service_id AND agency_id = p_agency_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or does not belong to this agency';
  END IF;

  -- Price: use override if given, else service price_cents
  v_unit_price := COALESCE(p_unit_price_cents, v_service.price_cents);
  v_total_price := v_unit_price * p_participant_count;

  -- Commission from marketplace_plan_configs (via agency tier)
  SELECT mpc.commission_rate_percent INTO v_commission_rate
  FROM public.agency_marketplace_subscriptions ams
  JOIN public.marketplace_plan_configs mpc ON mpc.tier = ams.tier
  WHERE ams.agency_id = p_agency_id AND ams.is_active = true
  LIMIT 1;
  v_commission_rate := COALESCE(v_commission_rate, 25.0); -- default starter 25%

  v_platform_fee := (v_total_price * v_commission_rate / 100.0)::INT;
  v_agency_payout := v_total_price - v_platform_fee;

  -- Generate a readable booking_number
  v_booking_number := 'BK-M-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Insert
  INSERT INTO public.marketplace_bookings (
    booking_number, service_id, agency_id, customer_id,
    status, booking_date, booking_time, participant_count,
    unit_price_cents, total_price_cents, platform_fee_cents, agency_payout_cents,
    customer_name, customer_email, customer_phone, customer_notes,
    assigned_guide_id, assigned_team_member_id,
    is_manual, source, confirmed_at
  ) VALUES (
    v_booking_number, p_service_id, p_agency_id, NULL,
    'confirmed', p_booking_date, p_booking_time, p_participant_count,
    v_unit_price, v_total_price, v_platform_fee, v_agency_payout,
    p_customer_name, p_customer_email, p_customer_phone, p_customer_notes,
    p_assigned_guide_id, p_assigned_team_member_id,
    true, 'manual', now()
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_manual_booking(
  UUID, UUID, DATE, TIME, INT, TEXT, TEXT, TEXT, TEXT, UUID, UUID, INT
) TO authenticated;
