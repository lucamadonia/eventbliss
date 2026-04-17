-- ============================================================
-- Public booking lookup by number
-- ============================================================
-- Exposes a SECURITY DEFINER RPC that returns a sanitized
-- subset of a marketplace_booking given its booking_number.
-- Safe fields only (no email / phone / pricing). Anyone with
-- the booking number can view — intended for sharing with
-- fellow participants via /booking/:number.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_booking(p_booking_number TEXT)
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
   WHERE b.booking_number = p_booking_number;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_booking(TEXT) TO anon, authenticated;
