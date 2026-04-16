-- ============================================
-- Assign a guide to a marketplace booking
-- ============================================

ALTER TABLE public.marketplace_bookings
ADD COLUMN IF NOT EXISTS assigned_guide_id UUID REFERENCES public.agency_guides(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mkt_bookings_assigned_guide
  ON public.marketplace_bookings(assigned_guide_id)
  WHERE assigned_guide_id IS NOT NULL;

COMMENT ON COLUMN public.marketplace_bookings.assigned_guide_id IS
  'Optional: agency-internal guide assigned to execute this booking. NULL = not yet assigned.';

-- Helper view: agency earnings summary (current month + all-time)
CREATE OR REPLACE VIEW public.agency_earnings_summary AS
SELECT
  b.agency_id,
  COUNT(*) FILTER (WHERE b.status = 'pending_confirmation') AS pending_count,
  COUNT(*) FILTER (WHERE b.status = 'confirmed') AS confirmed_count,
  COUNT(*) FILTER (WHERE b.status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE b.status IN ('cancelled_by_customer','cancelled_by_agency')) AS cancelled_count,
  COALESCE(SUM(b.agency_payout_cents) FILTER (WHERE b.status IN ('confirmed','completed')), 0) AS earnings_total_cents,
  COALESCE(SUM(b.agency_payout_cents) FILTER (
    WHERE b.status IN ('confirmed','completed')
      AND b.created_at >= date_trunc('month', now())
  ), 0) AS earnings_mtd_cents,
  COALESCE(SUM(b.agency_payout_cents) FILTER (
    WHERE b.status IN ('confirmed','completed')
      AND b.created_at >= (date_trunc('month', now()) - interval '1 month')
      AND b.created_at <  date_trunc('month', now())
  ), 0) AS earnings_last_month_cents,
  COALESCE(SUM(b.participant_count) FILTER (WHERE b.status IN ('confirmed','completed')), 0) AS participants_total,
  COUNT(*) FILTER (WHERE b.status IN ('confirmed','completed')) AS paid_bookings_count
FROM public.marketplace_bookings b
GROUP BY b.agency_id;

GRANT SELECT ON public.agency_earnings_summary TO authenticated;

-- Top-services-per-agency view (for Overview widget)
CREATE OR REPLACE VIEW public.agency_top_services AS
SELECT
  b.agency_id,
  b.service_id,
  s.title AS service_title,
  COUNT(*) AS booking_count,
  COALESCE(SUM(b.agency_payout_cents), 0) AS revenue_cents,
  COALESCE(SUM(b.participant_count), 0) AS participants_total
FROM public.marketplace_bookings b
LEFT JOIN public.marketplace_services s ON s.id = b.service_id
WHERE b.status IN ('confirmed', 'completed')
GROUP BY b.agency_id, b.service_id, s.title;

GRANT SELECT ON public.agency_top_services TO authenticated;

-- Monthly earnings series (last 6 months) for chart
CREATE OR REPLACE VIEW public.agency_earnings_monthly AS
SELECT
  b.agency_id,
  date_trunc('month', b.created_at)::date AS month,
  COALESCE(SUM(b.agency_payout_cents), 0) AS earnings_cents,
  COUNT(*) AS bookings_count,
  COALESCE(SUM(b.participant_count), 0) AS participants
FROM public.marketplace_bookings b
WHERE b.status IN ('confirmed', 'completed')
  AND b.created_at >= (date_trunc('month', now()) - interval '5 months')
GROUP BY b.agency_id, date_trunc('month', b.created_at);

GRANT SELECT ON public.agency_earnings_monthly TO authenticated;
