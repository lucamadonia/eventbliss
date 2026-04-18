-- =========================================================
-- EventBliss Expenses v2 — Full Schema
-- Masterplan: docs/expenses-v2-masterplan.md
--
-- This migration consolidates all v2 changes into one file for simpler
-- rollout. Every block is idempotent via DO $$ EXCEPTION blocks and
-- CREATE TABLE IF NOT EXISTS. Safe to re-run.
-- =========================================================

-- ---------------------------------------------------------
-- A) expenses — extend with v2 columns
-- ---------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS receipt_ocr_json      jsonb,
    ADD COLUMN IF NOT EXISTS original_currency     text,
    ADD COLUMN IF NOT EXISTS exchange_rate         numeric(18,8) CHECK (exchange_rate IS NULL OR exchange_rate > 0),
    ADD COLUMN IF NOT EXISTS recurring_template_id uuid,
    ADD COLUMN IF NOT EXISTS is_settled_cached     boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS settled_at            timestamptz,
    ADD COLUMN IF NOT EXISTS notes                 text,
    ADD COLUMN IF NOT EXISTS tags                  text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS category_id           uuid,
    ADD COLUMN IF NOT EXISTS emoji                 text,
    ADD COLUMN IF NOT EXISTS created_via           text NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS created_by_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.expenses
    ADD CONSTRAINT chk_expenses_created_via
    CHECK (created_via IN ('manual','camera','voice','import','template'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_event_date
  ON public.expenses(event_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_tmpl
  ON public.expenses(recurring_template_id) WHERE recurring_template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_tags_gin
  ON public.expenses USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_expenses_event_unsettled
  ON public.expenses(event_id) WHERE is_settled_cached = false AND deleted_at IS NULL;

-- ---------------------------------------------------------
-- B) expense_shares — extend with partial payment + disputes
-- ---------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE public.expense_shares
    ADD COLUMN IF NOT EXISTS paid_amount    numeric(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    ADD COLUMN IF NOT EXISTS reminded_at    timestamptz,
    ADD COLUMN IF NOT EXISTS dispute_note   text,
    ADD COLUMN IF NOT EXISTS dispute_status text NOT NULL DEFAULT 'none';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.expense_shares
    ADD CONSTRAINT chk_paid_amount_lte_amount CHECK (paid_amount <= amount);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.expense_shares
    ADD CONSTRAINT chk_dispute_status CHECK (dispute_status IN ('none','disputed','resolved'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill paid_amount from legacy is_paid boolean
UPDATE public.expense_shares
   SET paid_amount = amount
 WHERE is_paid = true AND paid_amount = 0;

CREATE INDEX IF NOT EXISTS idx_shares_participant_unpaid
  ON public.expense_shares(participant_id) WHERE paid_amount < amount;

-- ---------------------------------------------------------
-- C) expense_payers — multi-payer support (NEW)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_payers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id     uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  amount         numeric(14,2) NOT NULL CHECK (amount > 0),
  percentage     numeric(5,2)  CHECK (percentage IS NULL OR (percentage > 0 AND percentage <= 100)),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expense_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_payers_expense ON public.expense_payers(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payers_participant ON public.expense_payers(participant_id);

ALTER TABLE public.expense_payers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "payers_select_participant" ON public.expense_payers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.participants p ON p.event_id = e.event_id
      WHERE e.id = expense_id AND p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "payers_write_organizer_or_creator" ON public.expense_payers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.events ev ON ev.id = e.event_id
      WHERE e.id = expense_id
        AND (ev.created_by = auth.uid() OR e.created_by_user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill payers from legacy paid_by_participant_id
INSERT INTO public.expense_payers(expense_id, participant_id, amount)
  SELECT id, paid_by_participant_id, amount
    FROM public.expenses
   WHERE paid_by_participant_id IS NOT NULL
     AND deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------
-- D) expense_settlements — first-class money movements (NEW)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_settlements (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                  uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  from_participant_id       uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  to_participant_id         uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  amount                    numeric(14,2) NOT NULL CHECK (amount > 0),
  currency                  text NOT NULL DEFAULT 'EUR',
  method                    text NOT NULL CHECK (method IN ('cash','bank','paypal','revolut','wise','apple_pay','google_pay','other')),
  reference_url             text,
  note                      text,
  confirmed_by_payer_at     timestamptz,
  confirmed_by_payee_at     timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  CHECK (from_participant_id <> to_participant_id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_event ON public.expense_settlements(event_id);
CREATE INDEX IF NOT EXISTS idx_settlements_pair  ON public.expense_settlements(from_participant_id, to_participant_id);

ALTER TABLE public.expense_settlements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "settlements_select_participant" ON public.expense_settlements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.participants p
            WHERE p.event_id = expense_settlements.event_id AND p.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "settlements_insert_participant" ON public.expense_settlements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.participants p
            WHERE p.event_id = expense_settlements.event_id AND p.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "settlements_update_parties" ON public.expense_settlements FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM public.participants WHERE id = from_participant_id)
    OR auth.uid() = (SELECT user_id FROM public.participants WHERE id = to_participant_id)
    OR EXISTS (SELECT 1 FROM public.events WHERE id = expense_settlements.event_id AND created_by = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------
-- E) expense_recurring_templates (NEW)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_recurring_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title             text NOT NULL,
  amount            numeric(14,2) NOT NULL CHECK (amount > 0),
  currency          text NOT NULL DEFAULT 'EUR',
  category_id       uuid,
  emoji             text,
  split_config      jsonb NOT NULL,
  payer_config      jsonb NOT NULL,
  frequency         text NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly')),
  next_run_date     date NOT NULL,
  last_spawned_at   timestamptz,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_next ON public.expense_recurring_templates(next_run_date) WHERE is_active;

ALTER TABLE public.expense_recurring_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "rec_tmpl_rw_participant" ON public.expense_recurring_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.participants p
            WHERE p.event_id = expense_recurring_templates.event_id AND p.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.expenses
    ADD CONSTRAINT fk_expenses_recurring FOREIGN KEY (recurring_template_id)
    REFERENCES public.expense_recurring_templates(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------
-- F) expense_categories — per-event custom categories (NEW)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name       text NOT NULL,
  icon       text,
  emoji      text,
  color      text CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order int NOT NULL DEFAULT 0,
  is_system  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cat_event ON public.expense_categories(event_id);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "cat_read_participant" ON public.expense_categories FOR SELECT
  USING (
    event_id IS NULL
    OR EXISTS (SELECT 1 FROM public.participants p
               WHERE p.event_id = expense_categories.event_id AND p.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cat_write_organizer" ON public.expense_categories FOR ALL
  USING (
    event_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND created_by = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------
-- G) expense_activity_log — append-only audit (NEW)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_activity_log (
  id                    bigserial PRIMARY KEY,
  event_id              uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  expense_id            uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
  settlement_id         uuid REFERENCES public.expense_settlements(id) ON DELETE SET NULL,
  actor_participant_id  uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  actor_user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action                text NOT NULL,
  payload               jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_event_time
  ON public.expense_activity_log(event_id, created_at DESC);

ALTER TABLE public.expense_activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "activity_read_participant" ON public.expense_activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.participants p
            WHERE p.event_id = expense_activity_log.event_id AND p.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Writes only via SECURITY DEFINER trigger below.

-- ---------------------------------------------------------
-- H) fx_rates — cached exchange rates (NEW)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fx_rates (
  base       text NOT NULL,
  quote      text NOT NULL,
  rate_date  date NOT NULL,
  rate       numeric(18,8) NOT NULL CHECK (rate > 0),
  source     text NOT NULL DEFAULT 'exchangerate.host',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (base, quote, rate_date)
);

CREATE INDEX IF NOT EXISTS idx_fx_rates_date ON public.fx_rates(rate_date DESC);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "fx_rates_read_all_auth" ON public.fx_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Writes only via service-role Edge Function.

-- ---------------------------------------------------------
-- I) Balance view
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW public.expense_balance_view AS
SELECT
  p.event_id,
  p.id AS participant_id,
  COALESCE(paid.total,0) - COALESCE(owed.total,0)
    + COALESCE(settle_in.total,0) - COALESCE(settle_out.total,0) AS net_balance
FROM public.participants p
LEFT JOIN (
  SELECT ep.participant_id, e.event_id, SUM(ep.amount) AS total
  FROM public.expense_payers ep
  JOIN public.expenses e ON e.id = ep.expense_id
  WHERE e.deleted_at IS NULL
  GROUP BY ep.participant_id, e.event_id
) paid ON paid.participant_id = p.id AND paid.event_id = p.event_id
LEFT JOIN (
  SELECT es.participant_id, e.event_id, SUM(es.amount) AS total
  FROM public.expense_shares es
  JOIN public.expenses e ON e.id = es.expense_id
  WHERE e.deleted_at IS NULL
  GROUP BY es.participant_id, e.event_id
) owed ON owed.participant_id = p.id AND owed.event_id = p.event_id
LEFT JOIN (
  SELECT to_participant_id AS pid, event_id, SUM(amount) AS total
  FROM public.expense_settlements
  WHERE confirmed_by_payer_at IS NOT NULL AND confirmed_by_payee_at IS NOT NULL
  GROUP BY to_participant_id, event_id
) settle_in ON settle_in.pid = p.id AND settle_in.event_id = p.event_id
LEFT JOIN (
  SELECT from_participant_id AS pid, event_id, SUM(amount) AS total
  FROM public.expense_settlements
  WHERE confirmed_by_payer_at IS NOT NULL AND confirmed_by_payee_at IS NOT NULL
  GROUP BY from_participant_id, event_id
) settle_out ON settle_out.pid = p.id AND settle_out.event_id = p.event_id;

COMMENT ON VIEW public.expense_balance_view IS
  'Net balance per participant per event. Positive = owed money, negative = owes money.';

-- ---------------------------------------------------------
-- J) simplified_debts RPC
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.simplified_debts(p_event_id uuid)
RETURNS TABLE(from_participant_id uuid, to_participant_id uuid, amount numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  balances numeric[];
  ids uuid[];
  i int;
  j int;
  transfer numeric;
BEGIN
  -- Security gate
  IF NOT EXISTS (SELECT 1 FROM public.participants
                 WHERE event_id = p_event_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT
    array_agg(participant_id ORDER BY net_balance),
    array_agg(ROUND(net_balance, 2) ORDER BY net_balance)
  INTO ids, balances
  FROM public.expense_balance_view
  WHERE event_id = p_event_id AND net_balance IS NOT NULL;

  IF balances IS NULL THEN RETURN; END IF;

  i := 1;
  j := array_length(balances, 1);

  WHILE i < j LOOP
    IF balances[i] >= -0.005 THEN i := i + 1; CONTINUE; END IF;
    IF balances[j] <=  0.005 THEN j := j - 1; CONTINUE; END IF;

    transfer := LEAST(-balances[i], balances[j]);
    from_participant_id := ids[i];
    to_participant_id   := ids[j];
    amount              := transfer;
    RETURN NEXT;

    balances[i] := balances[i] + transfer;
    balances[j] := balances[j] - transfer;
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- K) Triggers
-- ---------------------------------------------------------

-- Activity log writer
CREATE OR REPLACE FUNCTION public.log_expense_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  actor_user uuid := auth.uid();
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.expense_activity_log(event_id, expense_id, actor_user_id, action, payload)
      VALUES (NEW.event_id, NEW.id, actor_user, 'expense.created',
              jsonb_build_object('amount', NEW.amount, 'description', NEW.description));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      INSERT INTO public.expense_activity_log(event_id, expense_id, actor_user_id, action, payload)
        VALUES (NEW.event_id, NEW.id, actor_user, 'expense.amount_changed',
                jsonb_build_object('from', OLD.amount, 'to', NEW.amount));
    END IF;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      INSERT INTO public.expense_activity_log(event_id, expense_id, actor_user_id, action, payload)
        VALUES (NEW.event_id, NEW.id, actor_user, 'expense.deleted',
                jsonb_build_object('reason', NEW.deletion_reason));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_expenses_activity ON public.expenses;
CREATE TRIGGER trg_expenses_activity
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_expense_activity();

-- Free-tier cap: block 6th expense if user is not Pro
CREATE OR REPLACE FUNCTION public.enforce_free_tier_cap()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_count int;
  is_pro boolean := false;
BEGIN
  -- Allow soft-delete restore (no change in count). Only check new INSERTs.
  IF (TG_OP <> 'INSERT') THEN RETURN NEW; END IF;

  -- Pro check: subscription table OR user_metadata flag
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = auth.uid()
      AND (expires_at IS NULL OR expires_at > now())
      AND plan IN ('premium','pro','lifetime')
  ) INTO is_pro;

  IF is_pro THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.expenses
  WHERE event_id = NEW.event_id AND deleted_at IS NULL;

  IF current_count >= 5 THEN
    RAISE EXCEPTION 'EXPENSE_LIMIT_FREE_TIER'
      USING ERRCODE = 'P0001',
            HINT = 'Upgrade to Pro for unlimited expenses per event.';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_expenses_free_tier_cap ON public.expenses;
CREATE TRIGGER trg_expenses_free_tier_cap
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_tier_cap();

-- Cache is_settled_cached when all shares are paid
CREATE OR REPLACE FUNCTION public.cache_expense_settled()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  total_expected numeric;
  total_paid numeric;
BEGIN
  SELECT SUM(amount), SUM(paid_amount) INTO total_expected, total_paid
    FROM public.expense_shares
   WHERE expense_id = NEW.expense_id;

  IF total_expected IS NULL OR total_expected = 0 THEN RETURN NEW; END IF;

  IF total_paid >= total_expected THEN
    UPDATE public.expenses
       SET is_settled_cached = true, settled_at = COALESCE(settled_at, now())
     WHERE id = NEW.expense_id AND is_settled_cached = false;
  ELSE
    UPDATE public.expenses
       SET is_settled_cached = false, settled_at = NULL
     WHERE id = NEW.expense_id AND is_settled_cached = true;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_shares_cache_settled ON public.expense_shares;
CREATE TRIGGER trg_shares_cache_settled
  AFTER INSERT OR UPDATE OF paid_amount ON public.expense_shares
  FOR EACH ROW EXECUTE FUNCTION public.cache_expense_settled();

-- Settlement → distribute paid_amount across open shares (oldest first)
CREATE OR REPLACE FUNCTION public.apply_settlement_to_shares()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  remaining numeric;
  share_row RECORD;
  delta numeric;
BEGIN
  -- Only act when both parties have confirmed
  IF NEW.confirmed_by_payer_at IS NULL OR NEW.confirmed_by_payee_at IS NULL THEN
    RETURN NEW;
  END IF;
  IF (OLD.confirmed_by_payer_at IS NOT NULL AND OLD.confirmed_by_payee_at IS NOT NULL) THEN
    RETURN NEW; -- already fully confirmed, no-op
  END IF;

  remaining := NEW.amount;

  FOR share_row IN
    SELECT es.id, es.amount, es.paid_amount
      FROM public.expense_shares es
      JOIN public.expenses e ON e.id = es.expense_id
     WHERE e.event_id = NEW.event_id
       AND es.participant_id = NEW.from_participant_id
       AND e.deleted_at IS NULL
       AND (es.amount - es.paid_amount) > 0
     ORDER BY e.expense_date ASC, e.created_at ASC
  LOOP
    IF remaining <= 0 THEN EXIT; END IF;
    delta := LEAST(remaining, share_row.amount - share_row.paid_amount);
    UPDATE public.expense_shares
       SET paid_amount = paid_amount + delta,
           paid_at = COALESCE(paid_at, now())
     WHERE id = share_row.id;
    remaining := remaining - delta;
  END LOOP;

  -- Log activity
  INSERT INTO public.expense_activity_log(event_id, settlement_id, actor_user_id, action, payload)
    VALUES (NEW.event_id, NEW.id, auth.uid(), 'settlement.confirmed',
            jsonb_build_object('from', NEW.from_participant_id, 'to', NEW.to_participant_id,
                               'amount', NEW.amount, 'method', NEW.method));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_settlement_apply_shares ON public.expense_settlements;
CREATE TRIGGER trg_settlement_apply_shares
  AFTER UPDATE ON public.expense_settlements
  FOR EACH ROW EXECUTE FUNCTION public.apply_settlement_to_shares();

-- ---------------------------------------------------------
-- L) Storage bucket for receipts
-- ---------------------------------------------------------
-- Note: Supabase storage buckets are best created via the API/CLI, but
-- an INSERT into storage.buckets is idempotent.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('expense-receipts', 'expense-receipts', false, 10485760,
          ARRAY['image/jpeg','image/png','image/heic','image/webp','application/pdf'])
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DO $$ BEGIN
  CREATE POLICY "receipts_read_participant" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'expense-receipts'
    AND EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.event_id::text = split_part(name, '/', 1)
        AND p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "receipts_write_participant" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.event_id::text = split_part(name, '/', 1)
        AND p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "receipts_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'expense-receipts'
    AND owner = auth.uid()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------
-- M) Seed default categories (system-level, nullable event_id)
-- ---------------------------------------------------------
INSERT INTO public.expense_categories (name, emoji, color, sort_order, is_system, event_id)
VALUES
  ('Transport',     '🚗', '#7C5CFF', 10, true, NULL),
  ('Accommodation', '🏨', '#4F7CFF', 20, true, NULL),
  ('Activities',    '🎯', '#FF7C5C', 30, true, NULL),
  ('Food',          '🍽️', '#2FD27A', 40, true, NULL),
  ('Drinks',        '🍻', '#FFB020', 50, true, NULL),
  ('Gifts',         '🎁', '#FF4D6D', 60, true, NULL),
  ('Other',         '💰', '#A1A7B3', 70, true, NULL)
ON CONFLICT DO NOTHING;

-- =========================================================
-- Rollback notes (as comments for safety; do not run automatically):
--
-- DROP TRIGGER IF EXISTS trg_settlement_apply_shares ON public.expense_settlements;
-- DROP TRIGGER IF EXISTS trg_shares_cache_settled    ON public.expense_shares;
-- DROP TRIGGER IF EXISTS trg_expenses_free_tier_cap  ON public.expenses;
-- DROP TRIGGER IF EXISTS trg_expenses_activity       ON public.expenses;
-- DROP FUNCTION IF EXISTS public.apply_settlement_to_shares();
-- DROP FUNCTION IF EXISTS public.cache_expense_settled();
-- DROP FUNCTION IF EXISTS public.enforce_free_tier_cap();
-- DROP FUNCTION IF EXISTS public.log_expense_activity();
-- DROP FUNCTION IF EXISTS public.simplified_debts(uuid);
-- DROP VIEW IF EXISTS public.expense_balance_view;
-- DROP TABLE IF EXISTS public.fx_rates;
-- DROP TABLE IF EXISTS public.expense_activity_log;
-- DROP TABLE IF EXISTS public.expense_categories;
-- DROP TABLE IF EXISTS public.expense_recurring_templates;
-- DROP TABLE IF EXISTS public.expense_settlements;
-- DROP TABLE IF EXISTS public.expense_payers;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS ... ; (all v2 columns)
-- ALTER TABLE public.expense_shares DROP COLUMN IF EXISTS ... ;

-- Verification:
-- SELECT * FROM public.expense_balance_view LIMIT 10;
-- SELECT * FROM public.simplified_debts('<uuid>');
-- SELECT * FROM public.expense_activity_log ORDER BY created_at DESC LIMIT 20;
