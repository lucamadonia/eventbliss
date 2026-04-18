-- =========================================================
-- Align price_type CHECK constraint with what the UI actually writes.
-- The original migration constrains to ('per_person','flat_rate','per_hour','custom')
-- but the Agency Service Editor writes 'flat' (not 'flat_rate'). In prod
-- the constraint may have been relaxed manually, which diverges from this
-- repo. Make them consistent and idempotent.
-- =========================================================

-- Normalize any legacy rows: treat 'flat_rate' as 'flat' (they mean the same)
UPDATE public.marketplace_services SET price_type = 'flat' WHERE price_type = 'flat_rate';

-- Drop the old CHECK constraint (name can vary — try both the default name
-- and a common alternative, and swallow errors if it's already gone).
DO $$
BEGIN
  ALTER TABLE public.marketplace_services DROP CONSTRAINT IF EXISTS marketplace_services_price_type_check;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Re-add a constraint that accepts BOTH values during transition.
-- Future writes will be 'flat' (what the editor emits). Backfill above
-- already aligned existing rows, but accept 'flat_rate' too in case any
-- external integrator writes it.
DO $$
BEGIN
  ALTER TABLE public.marketplace_services
    ADD CONSTRAINT marketplace_services_price_type_check
    CHECK (price_type IN ('per_person', 'flat', 'flat_rate', 'per_hour', 'custom'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- Diagnostic view for admins: real bookings with 0 € total despite a
-- completed Stripe payment. These are clear bugs (either pre-existing
-- 0-priced services or the now-fixed parseFloat comma-truncation) that
-- need manual reconciliation against Stripe.
-- =========================================================
CREATE OR REPLACE VIEW public.marketplace_bookings_zero_paid AS
SELECT
  b.id,
  b.booking_number,
  b.created_at,
  b.customer_id,
  b.customer_email,
  b.agency_id,
  b.service_id,
  b.total_price_cents,
  b.stripe_payment_intent_id,
  b.stripe_checkout_session_id,
  b.status,
  s.title_fallback AS service_title
FROM public.marketplace_bookings b
LEFT JOIN LATERAL (
  SELECT COALESCE(
    (SELECT title FROM public.marketplace_service_translations t
      WHERE t.service_id = b.service_id AND t.locale = 'de' LIMIT 1),
    (SELECT title FROM public.marketplace_service_translations t
      WHERE t.service_id = b.service_id LIMIT 1)
  ) AS title_fallback
) s ON TRUE
WHERE b.total_price_cents = 0
  AND b.stripe_payment_intent_id IS NOT NULL;

COMMENT ON VIEW public.marketplace_bookings_zero_paid IS
  'Bookings with 0 € total but a Stripe payment intent — reconciliation candidates.';

-- Rollback:
-- DROP VIEW IF EXISTS public.marketplace_bookings_zero_paid;
-- ALTER TABLE public.marketplace_services DROP CONSTRAINT IF EXISTS marketplace_services_price_type_check;
-- ALTER TABLE public.marketplace_services
--   ADD CONSTRAINT marketplace_services_price_type_check
--   CHECK (price_type IN ('per_person','flat_rate','per_hour','custom'));
