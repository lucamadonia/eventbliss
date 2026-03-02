-- Atomic voucher redemption function
CREATE OR REPLACE FUNCTION public.increment_voucher_used_count(
  p_voucher_id UUID,
  p_max_uses INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vouchers
  SET used_count = used_count + 1
  WHERE id = p_voucher_id
    AND (used_count < p_max_uses);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher has reached maximum redemptions';
  END IF;
END;
$$;

-- Processed webhook events table for idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id
  ON public.processed_webhook_events (stripe_event_id);

-- Unique constraint on affiliate_commissions to prevent duplicate commissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_commissions_stripe_session_id_key'
  ) THEN
    ALTER TABLE public.affiliate_commissions
      ADD CONSTRAINT affiliate_commissions_stripe_session_id_key UNIQUE (stripe_session_id);
  END IF;
END;
$$;

-- Atomic affiliate balance increment function
CREATE OR REPLACE FUNCTION public.increment_affiliate_balance(
  p_affiliate_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.affiliates
  SET
    pending_balance = pending_balance + p_amount,
    total_earnings = total_earnings + p_amount
  WHERE id = p_affiliate_id;
END;
$$;

-- Enable RLS on new table
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access processed events
CREATE POLICY "Service role only" ON public.processed_webhook_events
  FOR ALL USING (auth.role() = 'service_role');
