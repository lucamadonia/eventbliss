-- ============================================================================
-- Payment Method (online vs. on_site) + Cancellation Audit Log
-- ============================================================================
-- Warum: Marktplatz-Agenturen wollen entscheiden, ob sie online (Stripe Connect
-- inkl. Plattformprovision) oder vor Ort kassieren. Zusätzlich brauchen wir ein
-- unveränderliches Audit-Log für Stornos, um Missbrauch durch Agenturen
-- (Kunde buchen lassen, dann wieder absagen → Plattformgebühr sparen) zu
-- erkennen und Risiko-Flags an die Admin-UI zu liefern.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A) marketplace_services.payment_method
-- ---------------------------------------------------------------------------
-- Warum NOT NULL mit Default 'online': Bestandszeilen sollen nach der Migration
-- weiterhin wie gehabt online abgerechnet werden; das ist der sichere Default.
DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'online'
    CHECK (payment_method IN ('online', 'on_site'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN public.marketplace_services.payment_method IS
  'Zahlungsmodus: ''online'' = via Stripe Connect mit Plattformprovision, '
  '''on_site'' = Kunde zahlt direkt bei der Agentur (z.B. Bar/EC vor Ort). '
  'Bei on_site wird die Plattformprovision separat via Monatsrechnung erhoben.';

-- ---------------------------------------------------------------------------
-- B) marketplace_bookings.payment_method
-- ---------------------------------------------------------------------------
-- Warum mit Default und Backfill statt FK auf Service: die Buchung muss ihren
-- zum Buchungszeitpunkt gültigen Zahlungsmodus festhalten, auch wenn der
-- Service später auf einen anderen Modus geswitcht wird (Audit-Stabilität).
DO $$ BEGIN
  ALTER TABLE public.marketplace_bookings
    ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'online'
    CHECK (payment_method IN ('online', 'on_site'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN public.marketplace_bookings.payment_method IS
  'Eingefrorener Zahlungsmodus zum Buchungszeitpunkt. Bleibt stabil, auch wenn '
  'der Service später umgestellt wird. Steuert Payout- und Reminder-Logik.';

-- Backfill: Bestandsbuchungen erben den Modus ihres Services. Falls der Service
-- zwischenzeitlich gelöscht wurde (ON DELETE gibt es hier nicht, aber Sicherheit),
-- bleibt der Default 'online' bestehen.
UPDATE public.marketplace_bookings b
SET payment_method = s.payment_method
FROM public.marketplace_services s
WHERE b.service_id = s.id
  AND b.payment_method = 'online'       -- nur Default-Werte überschreiben
  AND s.payment_method IS DISTINCT FROM 'online';

-- ---------------------------------------------------------------------------
-- C) marketplace_booking_cancellations (Audit-Log)
-- ---------------------------------------------------------------------------
-- Warum separate Tabelle statt Spalten auf bookings: Historie (mehrere
-- Reklamationen pro Buchung im Streitfall möglich), strenges Append-Only-
-- Muster, und RLS-Isolation für Admin-Analytics ohne die Haupttabelle zu
-- belasten.
CREATE TABLE IF NOT EXISTS public.marketplace_booking_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.marketplace_bookings(id) ON DELETE CASCADE,
  cancelled_by TEXT NOT NULL CHECK (cancelled_by IN ('customer', 'agency', 'platform', 'system')),
  reason_code TEXT NOT NULL CHECK (reason_code IN (
    'customer_changed_mind', 'customer_unreachable', 'customer_no_show',
    'agency_unavailable', 'agency_staff_shortage', 'agency_weather',
    'agency_other', 'platform_policy', 'platform_fraud_suspected',
    'system_payment_timeout', 'system_duplicate'
  )),
  reason_text TEXT,
  cancelled_by_user_id UUID REFERENCES auth.users(id),
  agency_id UUID REFERENCES public.agencies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.marketplace_booking_cancellations IS
  'Append-only Audit-Log jedes Stornos. Wird sowohl vom Trigger auf '
  'marketplace_bookings (bei Statuswechsel) als auch explizit durch '
  'Edge Functions geschrieben. Basis für agency_cancellation_rates und '
  'Admin-Fraud-Detection.';

-- Index-Strategie:
--   1) (agency_id, created_at DESC) für Rolling-Window-Aggregate je Agentur.
--   2) (booking_id) für den Trigger-Check auf Duplikate + Detail-Lookups.
CREATE INDEX IF NOT EXISTS idx_bkc_agency_created
  ON public.marketplace_booking_cancellations(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bkc_booking
  ON public.marketplace_booking_cancellations(booking_id);

ALTER TABLE public.marketplace_booking_cancellations ENABLE ROW LEVEL SECURITY;

-- RLS: Kunden sehen nur Stornos zu eigenen Buchungen.
DROP POLICY IF EXISTS "Customers view cancellations of own bookings"
  ON public.marketplace_booking_cancellations;
CREATE POLICY "Customers view cancellations of own bookings"
  ON public.marketplace_booking_cancellations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_bookings b
      WHERE b.id = marketplace_booking_cancellations.booking_id
        AND b.customer_id = auth.uid()
    )
  );

-- RLS: Agentur-Mitglieder sehen Stornos ihrer Agentur.
DROP POLICY IF EXISTS "Agency members view own cancellations"
  ON public.marketplace_booking_cancellations;
CREATE POLICY "Agency members view own cancellations"
  ON public.marketplace_booking_cancellations FOR SELECT
  USING (
    agency_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.agency_members m
      WHERE m.agency_id = marketplace_booking_cancellations.agency_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- RLS: Plattform-Admins haben volle Rechte (SELECT/INSERT/UPDATE/DELETE).
-- Warum ALL statt nur SELECT: Admins müssen in Streitfällen manuell Stornos
-- nachtragen oder Reason-Codes korrigieren können.
DROP POLICY IF EXISTS "Admins manage all cancellations"
  ON public.marketplace_booking_cancellations;
CREATE POLICY "Admins manage all cancellations"
  ON public.marketplace_booking_cancellations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS INSERT: Kunde darf Eigenstorno loggen (nur wenn sie Owner der Buchung
-- sind UND cancelled_by = 'customer'). Service-Role (Edge Functions) umgeht
-- RLS ohnehin; diese Policy ist nur für direkten Client-Zugriff relevant.
DROP POLICY IF EXISTS "Customers insert own cancellation"
  ON public.marketplace_booking_cancellations;
CREATE POLICY "Customers insert own cancellation"
  ON public.marketplace_booking_cancellations FOR INSERT
  WITH CHECK (
    cancelled_by = 'customer'
    AND cancelled_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_bookings b
      WHERE b.id = marketplace_booking_cancellations.booking_id
        AND b.customer_id = auth.uid()
    )
  );

-- RLS INSERT: Agentur-Mitglieder (Owner/Admin/Manager) dürfen Stornos im
-- Namen der Agentur loggen.
DROP POLICY IF EXISTS "Agency members insert own cancellation"
  ON public.marketplace_booking_cancellations;
CREATE POLICY "Agency members insert own cancellation"
  ON public.marketplace_booking_cancellations FOR INSERT
  WITH CHECK (
    cancelled_by = 'agency'
    AND agency_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.agency_members m
      WHERE m.agency_id = marketplace_booking_cancellations.agency_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','manager')
        AND m.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- D) View: agency_cancellation_rates (Rolling 30-Tage)
-- ---------------------------------------------------------------------------
-- Warum View statt Materialized View: Stornoraten müssen bei Admin-Aktionen
-- (z.B. Flag-Setzen, Agentur sperren) live stimmen. Wenn die Tabellen wachsen
-- und die Query zu teuer wird, empfiehlt sich ein Refresh einer MV alle 10min.
CREATE OR REPLACE VIEW public.agency_cancellation_rates AS
WITH windowed AS (
  SELECT
    a.id   AS agency_id,
    a.name AS agency_name,
    COUNT(DISTINCT b.id) FILTER (
      WHERE b.created_at >= now() - interval '30 days'
    ) AS total_bookings_30d,
    COUNT(DISTINCT c.booking_id) FILTER (
      WHERE c.cancelled_by = 'agency'
        AND c.created_at >= now() - interval '30 days'
    ) AS agency_cancels_30d
  FROM public.agencies a
  LEFT JOIN public.marketplace_bookings b              ON b.agency_id = a.id
  LEFT JOIN public.marketplace_booking_cancellations c ON c.booking_id = b.id
  GROUP BY a.id, a.name
)
SELECT
  agency_id,
  agency_name,
  total_bookings_30d,
  agency_cancels_30d,
  CASE
    WHEN total_bookings_30d = 0 THEN 0::numeric
    ELSE ROUND(100.0 * agency_cancels_30d / total_bookings_30d, 2)
  END AS cancel_rate_30d,
  CASE
    WHEN total_bookings_30d < 10 THEN 'insufficient_data'
    WHEN total_bookings_30d = 0  THEN 'insufficient_data'
    WHEN (100.0 * agency_cancels_30d / NULLIF(total_bookings_30d, 0)) > 20 THEN 'critical'
    WHEN (100.0 * agency_cancels_30d / NULLIF(total_bookings_30d, 0)) > 15 THEN 'warning'
    ELSE 'ok'
  END AS risk_level
FROM windowed;

COMMENT ON VIEW public.agency_cancellation_rates IS
  'Rolling-30-Tage-Stornoquote je Agentur. Schwellen: >20% critical, >15% '
  'warning, <10 Buchungen insufficient_data. Treibt das Admin-Risiko-Dashboard.';

-- ---------------------------------------------------------------------------
-- E) Trigger: Auto-Audit bei Status-Wechsel auf cancelled_by_*
-- ---------------------------------------------------------------------------
-- Warum AFTER UPDATE statt BEFORE: das Audit darf erst geschrieben werden,
-- wenn der UPDATE persistiert ist. Dedupe über WHERE NOT EXISTS, damit
-- mehrfache Statuswechsel (etwa erneutes Setzen durch Webhook-Retry) nicht
-- zu doppelten Einträgen führen.
CREATE OR REPLACE FUNCTION public.log_booking_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_cancelled_by  TEXT;
  v_reason_code   TEXT;
BEGIN
  -- Nur handeln, wenn Status NEU cancelled_* ist und sich geändert hat.
  IF NEW.status NOT IN ('cancelled_by_customer', 'cancelled_by_agency') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Mapping Status → Audit-Felder.
  IF NEW.status = 'cancelled_by_agency' THEN
    v_cancelled_by := 'agency';
    v_reason_code  := 'agency_other';
  ELSE
    v_cancelled_by := 'customer';
    v_reason_code  := 'customer_changed_mind';
  END IF;

  -- Dedupe: wenn Edge Function schon einen Eintrag geschrieben hat (mit
  -- präzisem reason_code), nicht überschreiben.
  IF EXISTS (
    SELECT 1 FROM public.marketplace_booking_cancellations
    WHERE booking_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.marketplace_booking_cancellations (
    booking_id, cancelled_by, reason_code, reason_text, agency_id
  ) VALUES (
    NEW.id,
    v_cancelled_by,
    v_reason_code,
    NEW.cancellation_reason,
    NEW.agency_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_booking_cancellation
  ON public.marketplace_bookings;
CREATE TRIGGER trg_log_booking_cancellation
  AFTER UPDATE OF status ON public.marketplace_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_cancellation();

COMMENT ON FUNCTION public.log_booking_cancellation() IS
  'Schreibt einen Audit-Eintrag, wenn eine Buchung in einen cancelled_*-Status '
  'übergeht. Dedupliziert über booking_id, damit Edge-Function-Inserts '
  '(präzisere Reason-Codes) Vorrang behalten.';

-- ---------------------------------------------------------------------------
-- F) Helper: agency_risk_level(uuid) → text
-- ---------------------------------------------------------------------------
-- Warum STABLE SECURITY DEFINER: Admin-UI ruft die Funktion mit dem
-- Anon-Key an und braucht deterministische Auswertung über alle Buchungen
-- der Agentur (sonst würde RLS die Zählung verfälschen).
CREATE OR REPLACE FUNCTION public.agency_risk_level(p_agency_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total       INT;
  v_cancels     INT;
  v_rate        NUMERIC;
BEGIN
  SELECT
    COUNT(DISTINCT b.id) FILTER (WHERE b.created_at >= now() - interval '30 days'),
    COUNT(DISTINCT c.booking_id) FILTER (
      WHERE c.cancelled_by = 'agency'
        AND c.created_at >= now() - interval '30 days'
    )
  INTO v_total, v_cancels
  FROM public.marketplace_bookings b
  LEFT JOIN public.marketplace_booking_cancellations c ON c.booking_id = b.id
  WHERE b.agency_id = p_agency_id;

  IF v_total IS NULL OR v_total < 10 THEN
    RETURN 'insufficient_data';
  END IF;

  v_rate := 100.0 * v_cancels / v_total;

  IF v_rate > 20 THEN RETURN 'critical'; END IF;
  IF v_rate > 15 THEN RETURN 'warning';  END IF;
  RETURN 'ok';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.agency_risk_level(UUID) IS
  'Ampel-Status einer Agentur im 30-Tage-Fenster. Gibt insufficient_data '
  'zurück, solange weniger als 10 Buchungen existieren — verhindert, dass '
  'neue Agenturen nach 1 Storno sofort als critical gelten.';

-- ---------------------------------------------------------------------------
-- G) RLS für marketplace_services (payment_method)
-- ---------------------------------------------------------------------------
-- Die bestehende Policy "Agency members manage own services" deckt mit
-- FOR ALL bereits UPDATE auf beliebigen Spalten ab, inkl. payment_method.
-- Kein neuer Policy-Scope nötig. (Verifiziert in Migration 20260412000000,
-- Zeilen 362-372.)

-- ============================================================================
-- Rollback-Hinweise
-- ============================================================================
-- Reihenfolge (umgekehrt zur Anlage, damit Abhängigkeiten auflösen):
--
--   DROP TRIGGER  IF EXISTS trg_log_booking_cancellation  ON public.marketplace_bookings;
--   DROP FUNCTION IF EXISTS public.log_booking_cancellation();
--   DROP FUNCTION IF EXISTS public.agency_risk_level(UUID);
--   DROP VIEW     IF EXISTS public.agency_cancellation_rates;
--   DROP TABLE    IF EXISTS public.marketplace_booking_cancellations;
--   ALTER TABLE   public.marketplace_bookings  DROP COLUMN IF EXISTS payment_method;
--   ALTER TABLE   public.marketplace_services  DROP COLUMN IF EXISTS payment_method;
--
-- Achtung: DROP der Tabelle vernichtet das Audit-Log unwiderruflich.
-- Vor Prod-Rollback bitte in marketplace_booking_cancellations_backup_YYYYMMDD
-- exportieren.

-- ============================================================================
-- Verifikations-Testschablone (manuell nach der Migration ausführen)
-- ============================================================================
-- 1) Spalten existieren und Default greift
--      SELECT column_name, data_type, column_default, is_nullable
--      FROM information_schema.columns
--      WHERE table_schema = 'public'
--        AND table_name   IN ('marketplace_services','marketplace_bookings')
--        AND column_name  = 'payment_method';
--
-- 2) Backfill war korrekt (keine Mismatch-Fälle übrig)
--      SELECT b.id, b.payment_method AS booking_pm, s.payment_method AS service_pm
--      FROM public.marketplace_bookings b
--      JOIN public.marketplace_services s ON s.id = b.service_id
--      WHERE b.payment_method <> s.payment_method
--      LIMIT 20;
--
-- 3) Trigger funktioniert — Testbuchung auf cancelled_by_customer setzen:
--      UPDATE public.marketplace_bookings
--         SET status = 'cancelled_by_customer',
--             cancellation_reason = 'Test: Plan geändert'
--       WHERE id = '<UUID>';
--      SELECT * FROM public.marketplace_booking_cancellations
--       WHERE booking_id = '<UUID>';
--
-- 4) Dedupe: zweites UPDATE darf NICHT zu einem zweiten Audit-Eintrag führen:
--      UPDATE public.marketplace_bookings SET status = 'cancelled_by_customer' WHERE id = '<UUID>';
--      SELECT COUNT(*) FROM public.marketplace_booking_cancellations WHERE booking_id = '<UUID>'; -- expect 1
--
-- 5) Risiko-View: auffällige Agenturen
--      SELECT * FROM public.agency_cancellation_rates
--       WHERE risk_level <> 'ok'
--       ORDER BY cancel_rate_30d DESC NULLS LAST;
--
-- 6) Helper-Funktion:
--      SELECT public.agency_risk_level('<AGENCY_UUID>');   -- 'ok' | 'warning' | 'critical' | 'insufficient_data'
--
-- 7) RLS smoke-test (als Kunde): eigene Stornos sichtbar, fremde nicht
--      SET ROLE authenticated;
--      SELECT SET_CONFIG('request.jwt.claim.sub', '<CUSTOMER_UUID>', true);
--      SELECT COUNT(*) FROM public.marketplace_booking_cancellations;
--      RESET ROLE;
