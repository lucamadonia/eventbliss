-- RevenueCat support for native in-app purchases (iOS/Android).
-- Adds a payment provider discriminator plus store product metadata to
-- public.subscriptions so Stripe (web) and RevenueCat (native) can coexist.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe', 'revenuecat', 'manual'));

-- Store product identifier: App Store / Play Store product id for
-- RevenueCat, Stripe price id for Stripe.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS product_id TEXT;

-- Normalized plan type ('monthly' | 'yearly' | 'lifetime'); nullable for
-- legacy rows where the type is unknown.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_type TEXT;

-- Backfill: manually granted subscriptions are their own provider.
UPDATE public.subscriptions
SET provider = 'manual'
WHERE is_manual = true;

COMMENT ON COLUMN public.subscriptions.provider IS
  'Payment provider that owns this subscription: stripe (web checkout), revenuecat (native IAP), manual (admin-granted).';
COMMENT ON COLUMN public.subscriptions.product_id IS
  'Store product id (RevenueCat) or Stripe price id (Stripe).';
COMMENT ON COLUMN public.subscriptions.plan_type IS
  'Normalized plan type: monthly | yearly | lifetime. Nullable for legacy rows.';
