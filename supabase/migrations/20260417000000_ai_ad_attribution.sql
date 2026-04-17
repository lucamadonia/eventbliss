-- =====================================================================
-- AI-to-Marketplace Ad Attribution
-- Unified event log for AI recommendation impressions, clicks, and
-- booking attributions. Gates AI visibility to Enterprise-tier agencies
-- and gives paying agencies full ROI transparency.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Main event log table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_ai_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind            text NOT NULL CHECK (event_kind IN ('impression','click','booking_attributed')),
  service_id            uuid NOT NULL REFERENCES public.marketplace_services(id) ON DELETE CASCADE,
  agency_id             uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_event_id         uuid REFERENCES public.events(id) ON DELETE SET NULL,
  impression_id         uuid REFERENCES public.marketplace_ai_events(id) ON DELETE SET NULL,
  booking_id            uuid REFERENCES public.marketplace_bookings(id) ON DELETE SET NULL,
  request_type          text,
  matched_keywords      text[],
  match_category        text,
  match_position        integer,
  match_score           integer,
  source_location       text,
  section_title         text,
  ai_response_excerpt   text,
  locale                text,
  city_hint             text,
  event_type_hint       text,
  agency_tier_at_event  text,
  referrer_path         text,
  user_agent            text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_events_agency_created  ON public.marketplace_ai_events(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_service_created ON public.marketplace_ai_events(service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_user_created    ON public.marketplace_ai_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_kind_created    ON public.marketplace_ai_events(event_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_user_service    ON public.marketplace_ai_events(user_id, service_id, event_kind, created_at DESC);

-- ---------------------------------------------------------------------
-- 2) RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.marketplace_ai_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins see all ai events"            ON public.marketplace_ai_events;
DROP POLICY IF EXISTS "Agency members see own ai events"    ON public.marketplace_ai_events;
DROP POLICY IF EXISTS "Authenticated users can log events"  ON public.marketplace_ai_events;

CREATE POLICY "Admins see all ai events"
  ON public.marketplace_ai_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency members see own ai events"
  ON public.marketplace_ai_events FOR SELECT
  USING (agency_id IN (
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can log events"
  ON public.marketplace_ai_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------
-- 3) Booking source column for attribution
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='marketplace_bookings' AND column_name='source'
  ) THEN
    ALTER TABLE public.marketplace_bookings
      ADD COLUMN source text DEFAULT 'manual'
      CHECK (source IN ('manual','marketplace_search','ai_contextual','agency_page'));
  END IF;
END$$;

-- ---------------------------------------------------------------------
-- 4) Attribution trigger: on booking insert, look back 72h for AI click
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attribute_booking_to_ai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_click_id         uuid;
  v_impression_id    uuid;
  v_request_type     text;
  v_matched_keywords text[];
BEGIN
  SELECT id, impression_id, request_type, matched_keywords
    INTO v_click_id, v_impression_id, v_request_type, v_matched_keywords
  FROM public.marketplace_ai_events
  WHERE event_kind = 'click'
    AND service_id = NEW.service_id
    AND user_id = NEW.customer_id
    AND created_at >= NEW.created_at - interval '72 hours'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_click_id IS NOT NULL THEN
    UPDATE public.marketplace_bookings
       SET source = 'ai_contextual'
     WHERE id = NEW.id;

    INSERT INTO public.marketplace_ai_events (
      event_kind, service_id, agency_id, user_id, booking_id, impression_id,
      request_type, matched_keywords, source_location
    ) VALUES (
      'booking_attributed', NEW.service_id, NEW.agency_id, NEW.customer_id, NEW.id, v_impression_id,
      v_request_type, v_matched_keywords, 'booking_trigger'
    );
  END IF;

  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_attribute_booking_to_ai ON public.marketplace_bookings;
CREATE TRIGGER trg_attribute_booking_to_ai
  AFTER INSERT ON public.marketplace_bookings
  FOR EACH ROW EXECUTE FUNCTION public.attribute_booking_to_ai();

-- ---------------------------------------------------------------------
-- 5) Aggregated view for dashboards
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_agency_ai_performance;
CREATE VIEW public.v_agency_ai_performance
WITH (security_invoker = true)
AS
SELECT
  e.agency_id,
  a.name          AS agency_name,
  a.slug          AS agency_slug,
  a.marketplace_tier,
  COUNT(*) FILTER (WHERE e.event_kind = 'impression')          AS impressions,
  COUNT(*) FILTER (WHERE e.event_kind = 'click')               AS clicks,
  COUNT(*) FILTER (WHERE e.event_kind = 'booking_attributed')  AS attributed_bookings,
  COALESCE(SUM(b.total_price_cents) FILTER (WHERE e.event_kind = 'booking_attributed'), 0)::bigint
                                                                AS attributed_revenue_cents,
  CASE
    WHEN COUNT(*) FILTER (WHERE e.event_kind = 'impression') = 0 THEN 0
    ELSE (COUNT(*) FILTER (WHERE e.event_kind = 'click'))::numeric
         / COUNT(*) FILTER (WHERE e.event_kind = 'impression')::numeric
  END                                                            AS ctr,
  MAX(e.created_at)                                              AS last_event_at
FROM public.marketplace_ai_events e
JOIN public.agencies a ON a.id = e.agency_id
LEFT JOIN public.marketplace_bookings b ON b.id = e.booking_id
GROUP BY e.agency_id, a.name, a.slug, a.marketplace_tier;

GRANT SELECT ON public.v_agency_ai_performance TO authenticated;

-- ---------------------------------------------------------------------
-- Done
-- ---------------------------------------------------------------------
COMMENT ON TABLE public.marketplace_ai_events IS 'Unified log of AI recommendation impressions, clicks and booking attributions for Marketplace services';
COMMENT ON COLUMN public.marketplace_bookings.source IS 'Origin of the booking: manual, marketplace_search, ai_contextual (via AI recommendation), agency_page';
