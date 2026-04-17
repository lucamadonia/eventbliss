-- =========================================================
-- Slot-Kapazität: Personen pro Gruppe, parallele Gruppen,
-- Guide-Kapazität. Fixt auch den Zähler in useServiceAvailability:
-- bisher wurde die Anzahl der Buchungen gezählt, nicht die
-- Teilnehmerzahl — ab jetzt zählen Teilnehmer.
-- =========================================================

-- ---- marketplace_services: Kapazitätsfelder ----
DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN capacity_per_slot INT NOT NULL DEFAULT 10
      CHECK (capacity_per_slot > 0);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN groups_per_slot INT NOT NULL DEFAULT 1
      CHECK (groups_per_slot > 0);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.marketplace_services
    ADD COLUMN groups_per_guide INT NOT NULL DEFAULT 1
      CHECK (groups_per_guide > 0);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.marketplace_services.capacity_per_slot IS
  'Personen pro Gruppe. Effektive Slot-Kapazität = capacity_per_slot * groups_per_slot.';
COMMENT ON COLUMN public.marketplace_services.groups_per_slot IS
  'Parallele Gruppen je Zeitslot (z. B. 3 Rafting-Boote gleichzeitig).';
COMMENT ON COLUMN public.marketplace_services.groups_per_guide IS
  'Maximal parallele Gruppen, die ein Guide betreuen kann.';

-- ---- marketplace_availability.max_participants (neue Bedeutung) ----
-- max_bookings bleibt als Legacy-Spalte erhalten, wir fügen max_participants
-- hinzu. Wenn NULL → wird aus service.capacity_per_slot * groups_per_slot
-- abgeleitet. Damit bleiben alle alten Slots funktional.
DO $$ BEGIN
  ALTER TABLE public.marketplace_availability
    ADD COLUMN max_participants INT CHECK (max_participants IS NULL OR max_participants > 0);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.marketplace_availability.max_participants IS
  'Override pro Slot für die Gesamt-Teilnehmerzahl. NULL = vom Service erben.';

-- ---- Verfügbarkeitsansicht pro Slot und Datum ----
-- Ersetzt den bisherigen Client-seitigen Zähler. Summiert participant_count
-- (statt count(*)) und berücksichtigt payment_status.
CREATE OR REPLACE VIEW public.marketplace_slot_availability AS
SELECT
  b.service_id,
  b.booking_date,
  b.booking_time,
  COALESCE(SUM(b.participant_count), 0)::INT AS participants_booked,
  COUNT(DISTINCT b.id)::INT                  AS groups_booked
FROM public.marketplace_bookings b
WHERE b.status NOT IN ('cancelled_by_customer', 'cancelled_by_agency', 'refunded')
GROUP BY b.service_id, b.booking_date, b.booking_time;

COMMENT ON VIEW public.marketplace_slot_availability IS
  'Aggregierte Kapazitätsnutzung pro Slot (Datum+Zeit) — participants_booked summiert Teilnehmer, groups_booked zählt Buchungen/Gruppen.';

-- ---- Rollback-Notiz ----
-- DROP VIEW IF EXISTS public.marketplace_slot_availability;
-- ALTER TABLE public.marketplace_services
--   DROP COLUMN IF EXISTS capacity_per_slot,
--   DROP COLUMN IF EXISTS groups_per_slot,
--   DROP COLUMN IF EXISTS groups_per_guide;
-- ALTER TABLE public.marketplace_availability DROP COLUMN IF EXISTS max_participants;

-- ---- Verifikation ----
-- SELECT service_id, booking_date, booking_time, participants_booked, groups_booked
--   FROM public.marketplace_slot_availability ORDER BY booking_date DESC LIMIT 10;
