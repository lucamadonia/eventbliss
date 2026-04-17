-- ============================================================
-- Fix: marketplace_bookings.booking_number duplicate key
-- ============================================================
-- Two bugs in the previous generate_booking_number() trigger:
--
-- 1) RLS-limited visibility (the real bug): the function was
--    SECURITY INVOKER, so MAX(booking_number) ran under the
--    caller's RLS policies. Customers only see their own
--    bookings, so MAX returned the caller's max — producing a
--    number that already exists for a different customer's
--    booking. INSERT then failed with 23505.
--
-- 2) Race condition: concurrent inserts both read the same
--    MAX and generated identical numbers.
--
-- Fix: SECURITY DEFINER bypasses RLS so the function sees the
-- true global MAX, plus a transaction-scoped advisory lock per
-- year serializes concurrent inserts.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq INT;
  year_prefix TEXT;
BEGIN
  year_prefix := 'EB-' || TO_CHAR(NOW(), 'YYYY') || '-';

  -- Serialize concurrent booking creations within the same year.
  PERFORM pg_advisory_xact_lock(hashtext(year_prefix)::bigint);

  SELECT COALESCE(
           MAX(CAST(SUBSTRING(booking_number FROM LENGTH(year_prefix) + 1) AS INT)),
           0
         ) + 1
    INTO seq
    FROM public.marketplace_bookings
   WHERE booking_number LIKE year_prefix || '%';

  NEW.booking_number := year_prefix || LPAD(seq::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition is unchanged (still fires BEFORE INSERT when
-- booking_number is NULL or empty) — it references the function by
-- name, so CREATE OR REPLACE above is enough.
