-- Insert missing subscription for Thomas Veser
-- User ID: bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1
-- Stripe Customer: cus_Tle4PwbdbiGFJ1
-- Stripe Subscription: sub_1So6mIG3F2f0Er10swQ4YaIt
-- Current period end: 2026-02-10T22:49:38.000Z (from Stripe data)

INSERT INTO public.subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, expires_at, started_at)
VALUES (
  'bc0dbbba-4e0f-4ef1-a138-0d2ace93b1a1',
  'premium',
  'cus_Tle4PwbdbiGFJ1',
  'sub_1So6mIG3F2f0Er10swQ4YaIt',
  '2026-02-10T22:49:38.000Z',
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();