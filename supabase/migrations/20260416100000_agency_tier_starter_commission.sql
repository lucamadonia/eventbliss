-- Adjust Starter commission from 10% to 25% to incentivize Professional upgrade
-- Professional/Enterprise stay at 10%
UPDATE public.marketplace_plan_configs
SET
  commission_rate_percent = 25.00,
  features = '["Bis zu 3 Services listen", "Basis-Sichtbarkeit im Marketplace", "Buchungsmanagement", "25% Provision"]'::jsonb,
  updated_at = now()
WHERE tier = 'starter';
