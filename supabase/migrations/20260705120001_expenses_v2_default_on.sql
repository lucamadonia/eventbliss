-- Cut expenses v2 over to being the default experience for everyone.
--
-- 1) Replace the old positive `expenses_v2` flag (which could never reach
--    logged-out guests) with a kill-switch `expenses_v2_off`: missing/disabled
--    row = v2 ON; admin sets is_enabled=true to fall back to v1 for everyone.
--    rollout_percentage=100 so the kill-switch reaches guests too (see
--    useFeatureFlag: rollout>=100 includes logged-out users).
-- 2) Add expenses.split_meta to persist weighted-shares config.
-- 3) Re-run the legacy payer backfill: v1 kept inserting expenses WITHOUT an
--    expense_payers row after the schema migration ran, so those payers appear
--    to owe their own share in expense_balance_view. This backfill (idempotent)
--    repairs every such row and MUST ship together with the UI cutover.
--
-- Idempotent: safe to re-run.

-- 1) Kill-switch flag
INSERT INTO public.feature_flags (key, name, description, is_enabled, rollout_percentage)
VALUES (
  'expenses_v2_off',
  'Expenses v2 OFF (Kill-Switch)',
  'Wenn aktiviert, fällt die Ausgaben-UI auf die alte v1 zurück. Fehlende/deaktivierte Zeile = v2 ist an (Standard). rollout 100 = gilt auch für ausgeloggte Gäste.',
  false,
  100
)
ON CONFLICT (key) DO NOTHING;

-- Retire the old positive flag so nothing reads it anymore.
DELETE FROM public.feature_flags WHERE key = 'expenses_v2';

-- 2) Weighted-shares config storage
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS split_meta jsonb;

-- 3) Repair missing payer rows for v1 expenses created after the schema migration
INSERT INTO public.expense_payers(expense_id, participant_id, amount)
  SELECT e.id, e.paid_by_participant_id, e.amount
    FROM public.expenses e
   WHERE e.paid_by_participant_id IS NOT NULL
     AND e.deleted_at IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.expense_payers ep WHERE ep.expense_id = e.id
     )
ON CONFLICT DO NOTHING;
