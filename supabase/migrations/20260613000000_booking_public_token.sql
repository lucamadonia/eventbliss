-- ============================================================
-- Public booking token hardening (IDOR / enumeration defense)
-- ============================================================
-- booking_number is sequential (EB-2026-00012/00013…), so anyone
-- could enumerate foreign bookings via /booking/:number and read
-- their (sanitized) metadata. This migration adds an unguessable
-- per-booking `public_token` and requires it for anonymous /
-- non-owner access.
--
-- Access rules in get_public_booking():
--   * The logged-in OWNER (b.customer_id = auth.uid()) sees their
--     booking WITHOUT a token — share links keep working in-app.
--   * Everyone else (anon, or a different authenticated user) MUST
--     present the exact secret token (?t=…) to view.
--
-- The token is NEVER included in the returned JSONB — it stays a
-- pure capability carried in the share URL. The returned subset is
-- unchanged (first name / service / agency / city / date / status,
-- NO email / phone / pricing).
-- ============================================================

-- 1. Column + backfill + default + NOT NULL
ALTER TABLE public.marketplace_bookings
  ADD COLUMN IF NOT EXISTS public_token TEXT;

UPDATE public.marketplace_bookings
   SET public_token = replace(gen_random_uuid()::text, '-', '')
 WHERE public_token IS NULL;

ALTER TABLE public.marketplace_bookings
  ALTER COLUMN public_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

ALTER TABLE public.marketplace_bookings
  ALTER COLUMN public_token SET NOT NULL;

-- 2. Drop the old, unprotected single-arg signature, then recreate
--    with the optional token parameter.
DROP FUNCTION IF EXISTS public.get_public_booking(TEXT);

CREATE OR REPLACE FUNCTION public.get_public_booking(
  p_booking_number TEXT,
  p_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'booking_number', b.booking_number,
    'status', b.status,
    'booking_date', b.booking_date,
    'booking_time', b.booking_time,
    'participant_count', b.participant_count,
    'customer_first_name', SPLIT_PART(COALESCE(b.customer_name, ''), ' ', 1),
    'service_title', COALESCE(st.title, 'Service'),
    'service_slug', s.slug,
    'service_category', s.category,
    'service_cover', s.cover_image_url,
    'agency_name', a.name,
    'agency_slug', a.slug,
    'agency_city', a.city,
    'agency_country', a.country,
    'created_at', b.created_at
  )
    INTO result
    FROM public.marketplace_bookings b
    LEFT JOIN public.marketplace_services s
      ON s.id = b.service_id
    LEFT JOIN public.marketplace_service_translations st
      ON st.service_id = b.service_id AND st.locale = 'de'
    LEFT JOIN public.agencies a
      ON a.id = b.agency_id
   WHERE b.booking_number = p_booking_number
     AND (b.public_token = p_token OR b.customer_id = auth.uid());

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_booking(TEXT, TEXT) TO anon, authenticated;
