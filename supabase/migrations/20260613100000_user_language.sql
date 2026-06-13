-- =====================================================================
-- User language logging
-- Stores the UI language at booking time and on the user profile so that
-- transactional emails (booking confirmation + 24h reminder) can be sent
-- in the language the user actually used — including the cron-driven
-- reminder, which has no request context and must read it from the row.
-- =====================================================================

-- Booking-level language (nullable; runtime fallback to 'de' in the
-- booking-notify Edge Function). Set by marketplace-checkout / the
-- create-booking flow. External webhook bookings leave it NULL.
ALTER TABLE public.marketplace_bookings
  ADD COLUMN IF NOT EXISTS language TEXT;

-- Profile-level language (nullable). Populated from auth metadata on signup
-- (see handle_new_user below) and kept fresh by the frontend AuthProvider.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language TEXT;

-- Extend the existing handle_new_user trigger function so a new profile also
-- carries the language the user signed up in. useAuth.signUp stores it in
-- auth.users.raw_user_meta_data->>'language'. Recreating the function keeps
-- the existing on_auth_user_created trigger pointing at the new definition.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, must_change_password, language)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    false,
    new.raw_user_meta_data ->> 'language'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
