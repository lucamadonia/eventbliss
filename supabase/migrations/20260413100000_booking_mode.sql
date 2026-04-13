-- Add booking mode to marketplace_services
ALTER TABLE public.marketplace_services
  ADD COLUMN IF NOT EXISTS booking_mode TEXT DEFAULT 'internal'
  CHECK (booking_mode IN ('internal', 'external_api', 'external_redirect'));
ALTER TABLE public.marketplace_services
  ADD COLUMN IF NOT EXISTS external_booking_url TEXT;
ALTER TABLE public.marketplace_services
  ADD COLUMN IF NOT EXISTS external_provider TEXT;
ALTER TABLE public.marketplace_services
  ADD COLUMN IF NOT EXISTS external_provider_config JSONB DEFAULT '{}';
