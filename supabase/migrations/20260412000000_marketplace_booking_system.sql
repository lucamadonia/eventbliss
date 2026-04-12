-- ============================================
-- Marketplace & Booking System
-- Main revenue driver: 10% platform commission
-- ============================================

-- ---- Enums ----

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM (
    'draft', 'pending_review', 'approved', 'rejected', 'suspended', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM (
    'pending_payment', 'pending_confirmation', 'confirmed',
    'in_progress', 'completed',
    'cancelled_by_customer', 'cancelled_by_agency',
    'refunded', 'disputed', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 1. Agency Stripe Connect Accounts
-- ============================================

CREATE TABLE IF NOT EXISTS public.agency_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,
  stripe_account_id TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  country TEXT DEFAULT 'DE',
  default_currency TEXT DEFAULT 'eur',
  details_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_stripe_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_agency_stripe_agency ON public.agency_stripe_accounts(agency_id);

CREATE TRIGGER update_agency_stripe_accounts_updated_at
BEFORE UPDATE ON public.agency_stripe_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Marketplace Plan Configs (3 Tiers)
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_plan_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE CHECK (tier IN ('starter','professional','enterprise')),
  display_name TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  billing_interval TEXT CHECK (billing_interval IN ('monthly','yearly')),
  stripe_price_id TEXT,
  max_listings INT NOT NULL DEFAULT 3,
  has_profile_page BOOLEAN DEFAULT false,
  has_featured_listings BOOLEAN DEFAULT false,
  has_ai_integration BOOLEAN DEFAULT false,
  search_boost_factor NUMERIC(3,2) DEFAULT 1.00,
  commission_rate_percent NUMERIC(4,2) DEFAULT 10.00,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_plan_configs ENABLE ROW LEVEL SECURITY;

-- Seed default tiers
INSERT INTO public.marketplace_plan_configs (tier, display_name, price_cents, billing_interval, max_listings, has_profile_page, has_featured_listings, has_ai_integration, search_boost_factor, commission_rate_percent, sort_order, features)
VALUES
  ('starter', 'Starter', 0, NULL, 3, false, false, false, 1.00, 10.00, 1,
   '["Bis zu 3 Services listen", "Basis-Sichtbarkeit im Marketplace", "Buchungsmanagement", "10% Provision"]'::jsonb),
  ('professional', 'Professional', 4900, 'monthly', 20, true, true, false, 1.50, 10.00, 2,
   '["Bis zu 20 Services listen", "Eigene Agentur-Profilseite", "Featured Listings moeglich", "Priority in Suchergebnissen", "Pro Badge", "Detaillierte Analytics", "10% Provision"]'::jsonb),
  ('enterprise', 'Enterprise', 14900, 'monthly', -1, true, true, true, 2.00, 10.00, 3,
   '["Unbegrenzte Services", "Eigene Agentur-Profilseite", "Auto-Featured Listings", "Hoechste Suchpriorität", "Enterprise Badge", "KI-Buchungsintegration", "Volle Analytics + API", "10% Provision"]'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- ============================================
-- 3. Agency Marketplace Subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS public.agency_marketplace_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter','professional','enterprise')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_marketplace_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_agency_mkt_sub_agency ON public.agency_marketplace_subscriptions(agency_id);

CREATE TRIGGER update_agency_mkt_sub_updated_at
BEFORE UPDATE ON public.agency_marketplace_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. Marketplace Services (Core Catalog)
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  status public.listing_status NOT NULL DEFAULT 'draft',
  category TEXT NOT NULL CHECK (category IN (
    'workshop','entertainment','catering','music','decoration',
    'photography','venue','wellness','sport','transport','other'
  )),
  subcategory TEXT,
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  price_type TEXT NOT NULL DEFAULT 'per_person' CHECK (price_type IN ('per_person','flat_rate','per_hour','custom')),
  min_participants INT DEFAULT 1,
  max_participants INT,
  duration_minutes INT,
  location_type TEXT DEFAULT 'flexible' CHECK (location_type IN ('on_site','at_agency','online','flexible')),
  location_address TEXT,
  location_city TEXT,
  location_country TEXT DEFAULT 'DE',
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  booking_count INT DEFAULT 0,
  advance_booking_days INT DEFAULT 2,
  cancellation_policy TEXT DEFAULT 'moderate' CHECK (cancellation_policy IN ('flexible','moderate','strict')),
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percent INT DEFAULT 0 CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
  auto_confirm BOOLEAN DEFAULT false,
  admin_reviewed_by UUID REFERENCES auth.users(id),
  admin_reviewed_at TIMESTAMPTZ,
  admin_rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_services ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_services_agency ON public.marketplace_services(agency_id);
CREATE INDEX IF NOT EXISTS idx_mkt_services_slug ON public.marketplace_services(slug);
CREATE INDEX IF NOT EXISTS idx_mkt_services_status ON public.marketplace_services(status);
CREATE INDEX IF NOT EXISTS idx_mkt_services_category ON public.marketplace_services(category);
CREATE INDEX IF NOT EXISTS idx_mkt_services_city ON public.marketplace_services(location_city);
CREATE INDEX IF NOT EXISTS idx_mkt_services_browse ON public.marketplace_services(status, category, location_city);
CREATE INDEX IF NOT EXISTS idx_mkt_services_featured ON public.marketplace_services(is_featured, status) WHERE is_featured = true;

CREATE TRIGGER update_marketplace_services_updated_at
BEFORE UPDATE ON public.marketplace_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. Service Translations (10 locales)
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_service_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.marketplace_services(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('de','en','es','fr','it','nl','pl','pt','tr','ar')),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  includes TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_id, locale)
);

ALTER TABLE public.marketplace_service_translations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_translations_service ON public.marketplace_service_translations(service_id);

CREATE TRIGGER update_mkt_translations_updated_at
BEFORE UPDATE ON public.marketplace_service_translations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. Availability (Weekly recurring slots)
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.marketplace_services(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_bookings INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  CHECK (end_time > start_time)
);

ALTER TABLE public.marketplace_availability ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_availability_service ON public.marketplace_availability(service_id);

-- ============================================
-- 7. Blocked Dates
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.marketplace_services(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  UNIQUE(service_id, blocked_date)
);

ALTER TABLE public.marketplace_blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_blocked_service ON public.marketplace_blocked_dates(service_id);

-- ============================================
-- 8. Bookings (Core transaction table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  service_id UUID NOT NULL REFERENCES public.marketplace_services(id),
  agency_id UUID NOT NULL REFERENCES public.agencies(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status public.booking_status NOT NULL DEFAULT 'pending_payment',
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  participant_count INT NOT NULL CHECK (participant_count >= 1),
  unit_price_cents INT NOT NULL,
  total_price_cents INT NOT NULL,
  platform_fee_cents INT NOT NULL,
  agency_payout_cents INT NOT NULL,
  currency TEXT DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_transfer_id TEXT,
  stripe_refund_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_notes TEXT,
  agency_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount_cents INT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_service ON public.marketplace_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_agency ON public.marketplace_bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_customer ON public.marketplace_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_status ON public.marketplace_bookings(status);
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_date ON public.marketplace_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_number ON public.marketplace_bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_mkt_bookings_stripe ON public.marketplace_bookings(stripe_payment_intent_id);

-- Prevent double-booking (for single-slot services)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mkt_no_double_booking
ON public.marketplace_bookings (service_id, booking_date, booking_time)
WHERE status NOT IN ('cancelled_by_customer', 'cancelled_by_agency', 'refunded');

CREATE TRIGGER update_marketplace_bookings_updated_at
BEFORE UPDATE ON public.marketplace_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. Reviews
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.marketplace_bookings(id) UNIQUE,
  service_id UUID NOT NULL REFERENCES public.marketplace_services(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  agency_response TEXT,
  agency_responded_at TIMESTAMPTZ,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mkt_reviews_service ON public.marketplace_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_mkt_reviews_customer ON public.marketplace_reviews(customer_id);

-- Trigger: Update avg_rating + review_count on service
CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_services
  SET
    avg_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.marketplace_reviews
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id) AND is_visible = true
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.marketplace_reviews
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id) AND is_visible = true
    )
  WHERE id = COALESCE(NEW.service_id, OLD.service_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_service_rating
AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_service_rating();

-- ============================================
-- 10. Booking number generator
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_number FROM 9) AS INT)), 0) + 1
  INTO seq
  FROM public.marketplace_bookings
  WHERE booking_number LIKE 'EB-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  NEW.booking_number := 'EB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_booking_number
BEFORE INSERT ON public.marketplace_bookings
FOR EACH ROW
WHEN (NEW.booking_number IS NULL OR NEW.booking_number = '')
EXECUTE FUNCTION public.generate_booking_number();

-- ============================================
-- 11. RLS Policies
-- ============================================

-- marketplace_services
CREATE POLICY "Public can view approved services"
  ON public.marketplace_services FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Agency members manage own services"
  ON public.marketplace_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_services.agency_id
        AND agency_members.user_id = auth.uid()
        AND agency_members.role IN ('owner','admin','manager')
        AND agency_members.status = 'active'
    )
  );

CREATE POLICY "Admins manage all services"
  ON public.marketplace_services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- marketplace_service_translations
CREATE POLICY "Public can view translations of approved services"
  ON public.marketplace_service_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_services
      WHERE marketplace_services.id = marketplace_service_translations.service_id
        AND marketplace_services.status = 'approved'
    )
  );

CREATE POLICY "Agency members manage own translations"
  ON public.marketplace_service_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_services s
      JOIN public.agency_members m ON m.agency_id = s.agency_id
      WHERE s.id = marketplace_service_translations.service_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','manager')
        AND m.status = 'active'
    )
  );

-- marketplace_availability
CREATE POLICY "Public can view availability of approved services"
  ON public.marketplace_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_services
      WHERE marketplace_services.id = marketplace_availability.service_id
        AND marketplace_services.status = 'approved'
    )
  );

CREATE POLICY "Agency members manage own availability"
  ON public.marketplace_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_services s
      JOIN public.agency_members m ON m.agency_id = s.agency_id
      WHERE s.id = marketplace_availability.service_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','manager')
        AND m.status = 'active'
    )
  );

-- marketplace_blocked_dates
CREATE POLICY "Public can view blocked dates of approved services"
  ON public.marketplace_blocked_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_services
      WHERE marketplace_services.id = marketplace_blocked_dates.service_id
        AND marketplace_services.status = 'approved'
    )
  );

CREATE POLICY "Agency members manage own blocked dates"
  ON public.marketplace_blocked_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_services s
      JOIN public.agency_members m ON m.agency_id = s.agency_id
      WHERE s.id = marketplace_blocked_dates.service_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','manager')
        AND m.status = 'active'
    )
  );

-- marketplace_bookings
CREATE POLICY "Customers view own bookings"
  ON public.marketplace_bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Agency members view agency bookings"
  ON public.marketplace_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_bookings.agency_id
        AND agency_members.user_id = auth.uid()
        AND agency_members.status = 'active'
    )
  );

CREATE POLICY "Authenticated users create bookings"
  ON public.marketplace_bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Agency members update bookings"
  ON public.marketplace_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = marketplace_bookings.agency_id
        AND agency_members.user_id = auth.uid()
        AND agency_members.role IN ('owner','admin','manager')
        AND agency_members.status = 'active'
    )
  );

CREATE POLICY "Customers can cancel own bookings"
  ON public.marketplace_bookings FOR UPDATE
  USING (customer_id = auth.uid());

CREATE POLICY "Admins manage all bookings"
  ON public.marketplace_bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- marketplace_reviews
CREATE POLICY "Public can view visible reviews"
  ON public.marketplace_reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Customers create reviews for own bookings"
  ON public.marketplace_reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_bookings
      WHERE marketplace_bookings.id = marketplace_reviews.booking_id
        AND marketplace_bookings.customer_id = auth.uid()
        AND marketplace_bookings.status = 'completed'
    )
  );

CREATE POLICY "Admins manage all reviews"
  ON public.marketplace_reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- agency_stripe_accounts
CREATE POLICY "Agency members view own stripe account"
  ON public.agency_stripe_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = agency_stripe_accounts.agency_id
        AND agency_members.user_id = auth.uid()
        AND agency_members.status = 'active'
    )
  );

CREATE POLICY "Admins manage stripe accounts"
  ON public.agency_stripe_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- agency_marketplace_subscriptions
CREATE POLICY "Agency members view own marketplace sub"
  ON public.agency_marketplace_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_members.agency_id = agency_marketplace_subscriptions.agency_id
        AND agency_members.user_id = auth.uid()
        AND agency_members.status = 'active'
    )
  );

CREATE POLICY "Admins manage marketplace subs"
  ON public.agency_marketplace_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- marketplace_plan_configs (public read)
CREATE POLICY "Anyone can view plan configs"
  ON public.marketplace_plan_configs FOR SELECT
  USING (true);

CREATE POLICY "Admins manage plan configs"
  ON public.marketplace_plan_configs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 12. Add marketplace columns to agencies
-- ============================================

ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS marketplace_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_tier TEXT DEFAULT 'starter'
  CHECK (marketplace_tier IN ('starter','professional','enterprise'));

-- ============================================
-- 13. Add marketplace notification types
-- ============================================

ALTER TABLE public.agency_notifications
DROP CONSTRAINT IF EXISTS agency_notifications_type_check;

ALTER TABLE public.agency_notifications
ADD CONSTRAINT agency_notifications_type_check
CHECK (type IN ('deadline','task','budget','team','vendor','system','booking','marketplace','review'));
