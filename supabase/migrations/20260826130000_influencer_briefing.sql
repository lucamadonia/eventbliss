-- =====================================================================
-- Briefing, Materialien und Verlauf des Influencer-Programms
--
-- DREI EBENEN, ABSICHTLICH:
--   influencer_briefing_templates — einmal schreiben, fuer viele nutzen
--   influencer_briefings          — die KOPIE beim Influencer, anpassbar
--   influencer_deals.briefing_snapshot — beim Zusagen eingefroren, als Beleg
--
-- Es wird KOPIERT, nicht verwiesen. Wer eine Vorlage aendert, soll nicht
-- rueckwirkend aendern, was jemand vor drei Wochen zugesagt bekommen hat.
--
-- Die Feldliste stammt aus src/lib/influencer-briefing.ts. Wer dort ein Feld
-- ergaenzt, braucht hier eine Migration — und muss ausserdem entscheiden, ob
-- das Feld in die Positivliste PORTAL_FIELDS gehoert. Alles, was NICHT dort
-- steht, bleibt intern.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Gemeinsame Felder, zweimal verwendet
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_briefing_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  -- Optionale Zuordnung: eine Vorlage kann zu einer Gruppe oder einem Paket
  -- gehoeren, muss aber nicht.
  group_id BIGINT REFERENCES public.influencer_groups(id) ON DELETE SET NULL,
  package_id BIGINT REFERENCES public.influencer_packages(id) ON DELETE SET NULL,

  headline TEXT DEFAULT '',
  core_message TEXT DEFAULT '',
  tone TEXT DEFAULT '',
  dos TEXT[] DEFAULT '{}',
  donts TEXT[] DEFAULT '{}',
  mention_handles TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  link_url TEXT DEFAULT '',
  discount_code TEXT DEFAULT '',
  discount_note TEXT DEFAULT '',
  -- Verguetete Beitraege sind in Deutschland kennzeichnungspflichtig. Der
  -- Standard steht deshalb auf true: eine Voreinstellung, die das vergisst,
  -- produziert Verstoesse — beim Influencer, nicht bei uns.
  disclosure_required BOOLEAN NOT NULL DEFAULT true,
  disclosure_text TEXT DEFAULT 'Werbung',
  approval_required BOOLEAN NOT NULL DEFAULT false,
  publish_from TIMESTAMPTZ,
  publish_until TIMESTAMPTZ,
  extra TEXT DEFAULT '',
  -- Steht bewusst auch in der Vorlage: Hinweise fuer das eigene Team.
  internal_notes TEXT DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.influencer_briefings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Genau eines je Influencer. Zwei gleichzeitig gueltige Briefings waeren
  -- nicht entscheidbar.
  influencer_id BIGINT NOT NULL UNIQUE
    REFERENCES public.influencer_directory(id) ON DELETE CASCADE,
  -- Nur die Herkunft, kein lebender Verweis: Aenderungen an der Vorlage
  -- wirken NICHT zurueck.
  template_id BIGINT REFERENCES public.influencer_briefing_templates(id) ON DELETE SET NULL,

  headline TEXT DEFAULT '',
  core_message TEXT DEFAULT '',
  tone TEXT DEFAULT '',
  dos TEXT[] DEFAULT '{}',
  donts TEXT[] DEFAULT '{}',
  mention_handles TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  link_url TEXT DEFAULT '',
  discount_code TEXT DEFAULT '',
  discount_note TEXT DEFAULT '',
  disclosure_required BOOLEAN NOT NULL DEFAULT true,
  disclosure_text TEXT DEFAULT 'Werbung',
  approval_required BOOLEAN NOT NULL DEFAULT false,
  publish_from TIMESTAMPTZ,
  publish_until TIMESTAMPTZ,
  extra TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Der Beleg: was galt zum Zeitpunkt der Zusage.
ALTER TABLE public.influencer_deals
  ADD COLUMN IF NOT EXISTS briefing_snapshot JSONB;

COMMENT ON COLUMN public.influencer_deals.briefing_snapshot IS
  'Eingefrorenes Briefing zum Zeitpunkt der Zusage. Beleg, kein Arbeitsstand.';

-- ---------------------------------------------------------------------
-- 2) Materialien
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_briefing_assets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id BIGINT NOT NULL REFERENCES public.influencer_directory(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  -- Pfad im Bucket, NICHT die oeffentliche URL: der Bucket ist privat, die
  -- Adresse entsteht erst beim Abruf als zeitlich begrenzter Link.
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_assets_influencer
  ON public.influencer_briefing_assets(influencer_id);

/*
  PRIVATER Bucket, anders als `agency-assets` (dort oeffentlich).
  Briefing-Material ist unveroeffentlichtes Kampagnenmaterial: Rohschnitte,
  Media-Kits, teils Bilder Dritter. Was oeffentlich liegt, ist mit geratener
  Adresse abrufbar, und geraten wird heute maschinell.
*/
INSERT INTO storage.buckets (id, name, public)
VALUES ('influencer-assets', 'influencer-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Nur der Adminbereich laedt hoch und loescht. Der Influencer bekommt seine
-- Dateien ueber signierte Links aus der Edge Function, nie ueber diesen Weg.
CREATE POLICY "Admins manage influencer assets"
  ON storage.objects FOR ALL
  USING (bucket_id = 'influencer-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'influencer-assets' AND public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 3) Verlauf
--
-- Muster: agency_outreach_activity. Automatische Eintraege (Status, Deal,
-- Code, Konto) und Vermerke von Hand landen in derselben Zeitleiste — sonst
-- muss man beim Nachvollziehen zwei Listen zusammenlegen.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id BIGINT NOT NULL REFERENCES public.influencer_directory(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_activity_influencer
  ON public.influencer_activity(influencer_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 4) updated_at
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_influencer_briefings_updated
  BEFORE UPDATE ON public.influencer_briefings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_influencer_briefing_templates_updated
  BEFORE UPDATE ON public.influencer_briefing_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 5) RLS
--
-- Wie beim Verzeichnis: keine oeffentliche Leseregel. Der Influencer sieht
-- sein Briefing im persoenlichen Bereich ueber die Edge Function, die eine
-- ausdrueckliche Feldliste herausgibt — `internal_notes` steht nicht darin.
-- ---------------------------------------------------------------------
ALTER TABLE public.influencer_briefing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_briefing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access briefing_templates" ON public.influencer_briefing_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access briefings" ON public.influencer_briefings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access briefing_assets" ON public.influencer_briefing_assets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access influencer_activity" ON public.influencer_activity
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Angemeldete Influencer duerfen ihr eigenes Briefing lesen. Diese Regel
-- greift erst, wenn spaeter ein echtes Portal mit Login dazukommt; der
-- Token-Bereich liest weiterhin ueber die Function, weil nur sie die internen
-- Vermerke zuverlaessig heraushaelt.
CREATE POLICY "Influencer reads own briefing" ON public.influencer_briefings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.influencer_directory d
            WHERE d.id = influencer_briefings.influencer_id AND d.user_id = auth.uid())
  );
