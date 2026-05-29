-- Newsletter Double-Opt-In support — 2026-05-18
-- GDPR Art. 7 / Art. 6(1)(a) — proves informed consent before sending marketing.

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmation_token text,
  ADD COLUMN IF NOT EXISTS consent_evidence jsonb;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token
  ON public.newsletter_subscribers (confirmation_token)
  WHERE confirmation_token IS NOT NULL;

COMMENT ON COLUMN public.newsletter_subscribers.confirmation_token IS
  'One-time double-opt-in token; nulled after confirmation.';
COMMENT ON COLUMN public.newsletter_subscribers.consent_evidence IS
  'Snapshot of consent context at signup: form_version, locale, ip_hash, user_agent, timestamp. Art. 7(1) evidence.';
