-- =========================================================
-- Service Scheduling: Dauer, Puffer, Wiederholung, spezifische Termine
-- Bisher nur: duration_minutes (Dauer), marketplace_availability (wöchentlich),
-- marketplace_blocked_dates (Ausnahmen).
-- Neu:
--  - buffer_before_minutes / buffer_after_minutes → Pause vor/nach der Buchung
--  - scheduling_mode: wöchentlich wiederkehrend | nur spezifische Termine | mixed
--  - recurrence_interval: z. B. 2 = alle 2 Wochen, 4 = monatlich
--  - marketplace_service_dates: Liste spezifischer Termine (für Einzel-/Monats-Events)
-- =========================================================

-- ---- Puffer vor/nach Buchung ----
DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN buffer_before_minutes INT NOT NULL DEFAULT 0
      CHECK (buffer_before_minutes >= 0 AND buffer_before_minutes <= 1440);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN buffer_after_minutes INT NOT NULL DEFAULT 0
      CHECK (buffer_after_minutes >= 0 AND buffer_after_minutes <= 1440);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.marketplace_services.buffer_before_minutes IS
  'Puffer vor dem Slot-Start (Vorbereitung, Anreise) in Minuten.';
COMMENT ON COLUMN public.marketplace_services.buffer_after_minutes IS
  'Puffer nach dem Slot-Ende (Aufräumen, nächste Gruppe) in Minuten.';

-- ---- Terminmodus ----
DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN scheduling_mode TEXT NOT NULL DEFAULT 'weekly_recurring'
      CHECK (scheduling_mode IN ('always_available','weekly_recurring','specific_dates','mixed'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.marketplace_services.scheduling_mode IS
  'always_available: jederzeit buchbar nach Vorlaufzeit · '
  'weekly_recurring: wöchentliche Slots (marketplace_availability) · '
  'specific_dates: nur konkrete Termine (marketplace_service_dates) · '
  'mixed: Kombination beider Listen';

-- ---- Wiederholungsintervall für wöchentliche Slots ----
DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN recurrence_interval INT NOT NULL DEFAULT 1
      CHECK (recurrence_interval >= 1 AND recurrence_interval <= 12);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.marketplace_services.recurrence_interval IS
  'Wiederholungsintervall für weekly_recurring: 1 = jede Woche, 2 = alle zwei Wochen, 4 = monatlich.';

-- ---- Anker-Datum für Intervall-Berechnung ----
-- Ohne Anker ist „alle 2 Wochen" mehrdeutig. Mit Anker (z. B. erster Termin)
-- kann der Client prüfen: (target_date - anchor) / 7 % interval == 0.
DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN recurrence_anchor_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.marketplace_services.recurrence_anchor_date IS
  'Startdatum für die Intervallberechnung (erste Woche). Nur relevant wenn recurrence_interval > 1.';

-- ---- Tabelle: Spezifische Termine ----
CREATE TABLE IF NOT EXISTS public.marketplace_service_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.marketplace_services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INT, -- NULL = erbt von service.capacity_per_slot * groups_per_slot
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE(service_id, date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_mkt_service_dates_service ON public.marketplace_service_dates(service_id);
CREATE INDEX IF NOT EXISTS idx_mkt_service_dates_date ON public.marketplace_service_dates(date);

COMMENT ON TABLE public.marketplace_service_dates IS
  'Spezifische Einzeltermine für Services (z. B. einmalige Events, monatliche Workshops ohne festes Wochenraster).';

ALTER TABLE public.marketplace_service_dates ENABLE ROW LEVEL SECURITY;

-- Öffentliche SELECT für approved Services
DO $$ BEGIN
  CREATE POLICY "Public service_dates readable for approved services"
    ON public.marketplace_service_dates FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.marketplace_services s
        WHERE s.id = marketplace_service_dates.service_id
          AND s.status = 'approved'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Agency-Members dürfen eigene Dates verwalten
DO $$ BEGIN
  CREATE POLICY "Agency members manage service_dates"
    ON public.marketplace_service_dates FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.marketplace_services s
        JOIN public.agency_members am ON am.agency_id = s.agency_id
        WHERE s.id = marketplace_service_dates.service_id
          AND am.user_id = auth.uid()
          AND am.status = 'active'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.marketplace_services s
        JOIN public.agency_members am ON am.agency_id = s.agency_id
        WHERE s.id = marketplace_service_dates.service_id
          AND am.user_id = auth.uid()
          AND am.status = 'active'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins volle Rechte (passend zum Projektmuster)
DO $$ BEGIN
  CREATE POLICY "Admins manage service_dates"
    ON public.marketplace_service_dates FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---- Trigger: bei scheduling_mode='specific_dates' + keine Termine angelegt -> Hinweis
--    Kein harter CHECK, da Agenturen den Service ja erst konfigurieren dürfen;
--    der Client warnt im Editor.
-- =========================================================

-- Rollback-Block (auskommentiert):
-- DROP TABLE IF EXISTS public.marketplace_service_dates;
-- ALTER TABLE public.marketplace_services
--   DROP COLUMN IF EXISTS buffer_before_minutes,
--   DROP COLUMN IF EXISTS buffer_after_minutes,
--   DROP COLUMN IF EXISTS scheduling_mode,
--   DROP COLUMN IF EXISTS recurrence_interval,
--   DROP COLUMN IF EXISTS recurrence_anchor_date;

-- Verifikation:
-- SELECT service_id, date, start_time, end_time, max_participants
--   FROM public.marketplace_service_dates ORDER BY date LIMIT 5;
