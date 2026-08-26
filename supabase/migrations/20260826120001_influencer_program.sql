-- =====================================================================
-- Influencer-Programm — Verzeichnis, Konditionen, Leistungen
--
-- GETRENNT VON DEN AGENTUREN, ABSICHTLICH. `agency_directory` bleibt
-- unangetastet. Ein gemeinsames Partner-Verzeichnis muesste die Haelfte
-- seiner Spalten leer lassen (Stadt gegen Reichweite) und wuerde die
-- bestehende Agentur-Oberflaeche mitziehen. Geteilt wird spaeter der
-- Versand-Motor, nicht die Stammdaten.
--
-- ALLE CHECK-WERTE STAMMEN AUS src/lib/influencer-status.ts. Wer dort einen
-- Wert ergaenzt, muss hier eine Migration nachziehen. Das ist die Lehre aus
-- drei Constraint-Fehlern an einem Tag: eine Auswahl in der Oberflaeche, die
-- die Spalte nicht kennt, ergibt 23514 — und zwar erst beim Nutzer.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Gruppen: die Konditionen-Vorlage
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_groups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  -- Vorgaben, die ein Deal feldweise ueberschreiben darf.
  default_trial_months INT,
  default_commission_rate NUMERIC(5,2),
  default_fee_amount NUMERIC(10,2),
  default_package_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2) Leistungspakete
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  -- Zeitraum, in dem alles geliefert sein soll.
  duration_days INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.influencer_package_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id BIGINT NOT NULL REFERENCES public.influencer_packages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('reel','story','post','video','livestream','newsletter','other')),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Tage nach Start des Deals, an denen dieser Posten faellig ist.
  due_offset_days INT NOT NULL DEFAULT 14,
  requirements TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.influencer_groups
  ADD CONSTRAINT influencer_groups_default_package_fkey
  FOREIGN KEY (default_package_id) REFERENCES public.influencer_packages(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 3) Das Verzeichnis
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_directory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  handle TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  -- Pflicht fuer den Versand; doppelte Adressen waeren doppelte Ansprache.
  email TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram','tiktok','youtube','twitch','podcast','other')),
  profile_url TEXT DEFAULT '',
  country_code TEXT DEFAULT 'DE',
  -- Sprache der Ansprache; steuert spaeter die Vorlage und den Demolink.
  language TEXT DEFAULT 'de',
  followers INT,
  avg_views INT,
  engagement_rate NUMERIC(5,2),
  niche TEXT[] DEFAULT '{}',
  group_id BIGINT REFERENCES public.influencer_groups(id) ON DELETE SET NULL,
  outreach_status TEXT NOT NULL DEFAULT 'new'
    CHECK (outreach_status IN (
      'new','queued','contacted','follow_up_1','follow_up_2','replied',
      'negotiating','accepted','onboarded','delivering','delivered',
      'completed','declined','ghosted','cancelled'
    )),
  last_outreach_at TIMESTAMPTZ,
  last_response TEXT,
  last_response_at TIMESTAMPTZ,
  response_sentiment TEXT CHECK (response_sentiment IN ('positive','neutral','negative')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  tags TEXT[] DEFAULT '{}',
  -- Gesetzt, sobald der Influencer sich registriert und seinen Code einloest.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  invite_token TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_status ON public.influencer_directory(outreach_status);
CREATE INDEX IF NOT EXISTS idx_influencer_platform ON public.influencer_directory(platform);
CREATE INDEX IF NOT EXISTS idx_influencer_group ON public.influencer_directory(group_id);
CREATE INDEX IF NOT EXISTS idx_influencer_user ON public.influencer_directory(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_niche ON public.influencer_directory USING gin(niche);
CREATE INDEX IF NOT EXISTS idx_influencer_tags ON public.influencer_directory USING gin(tags);

-- ---------------------------------------------------------------------
-- 4) Der Deal: was vereinbart wurde
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_deals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id BIGINT NOT NULL REFERENCES public.influencer_directory(id) ON DELETE CASCADE,
  -- Mehrere Gegenleistungen gleichzeitig sind der Normalfall: Gratis-Premium
  -- UND Provision. Deshalb ein Array statt eines einzelnen Feldes.
  reward_kinds TEXT[] NOT NULL DEFAULT '{}',
  trial_months INT,
  unlimited BOOLEAN NOT NULL DEFAULT false,
  commission_rate NUMERIC(5,2),
  fee_amount NUMERIC(10,2),
  fee_currency TEXT DEFAULT 'EUR',
  fee_status TEXT DEFAULT 'open' CHECK (fee_status IN ('open','invoiced','paid')),
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
  package_id BIGINT REFERENCES public.influencer_packages(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','fulfilled','cancelled')),
  -- Beweiskette: wer hat wann was zugesagt.
  agreed_at TIMESTAMPTZ,
  agreed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_deals_influencer ON public.influencer_deals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_deals_status ON public.influencer_deals(status);

-- Nur EIN aktiver Deal je Influencer — zwei gleichzeitig laufende
-- Vereinbarungen waeren nicht abrechenbar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencer_deal_one_active
  ON public.influencer_deals(influencer_id) WHERE status = 'active';

-- ---------------------------------------------------------------------
-- 5) Die Einzelaufgaben
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influencer_deliverables (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  influencer_id BIGINT NOT NULL REFERENCES public.influencer_directory(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES public.influencer_deals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('reel','story','post','video','livestream','newsletter','other')),
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','submitted','approved','rejected','overdue','waived')),
  proof_url TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  -- Was es gebracht hat. Nullable: die Zahlen kommen spaeter, oft nie.
  reach INT,
  likes INT,
  comments INT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_deliverables_influencer ON public.influencer_deliverables(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_deliverables_status ON public.influencer_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_influencer_deliverables_due ON public.influencer_deliverables(due_at);

-- ---------------------------------------------------------------------
-- 6) updated_at
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_influencer_directory_updated
  BEFORE UPDATE ON public.influencer_directory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_influencer_deals_updated
  BEFORE UPDATE ON public.influencer_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_influencer_deliverables_updated
  BEFORE UPDATE ON public.influencer_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_influencer_groups_updated
  BEFORE UPDATE ON public.influencer_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 7) RLS
--
-- Kontaktdaten von Privatpersonen. Anders als beim Agentur-Verzeichnis gibt
-- es hier KEINE oeffentliche Leseregel — niemand ausser dem Adminbereich hat
-- etwas in dieser Liste zu suchen.
--
-- Der Influencer selbst sieht spaeter (Portal) nur seine eigene Zeile. Beim
-- Nachweis darf er ausschliesslich einreichen; die Freigabe bleibt beim
-- Adminbereich, sonst genehmigt er sich selbst.
-- ---------------------------------------------------------------------
ALTER TABLE public.influencer_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access influencer_directory" ON public.influencer_directory
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access influencer_groups" ON public.influencer_groups
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access influencer_packages" ON public.influencer_packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access influencer_package_items" ON public.influencer_package_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access influencer_deals" ON public.influencer_deals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins full access influencer_deliverables" ON public.influencer_deliverables
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Der Influencer sieht seine eigene Zeile und seine eigenen Aufgaben.
CREATE POLICY "Influencer reads own row" ON public.influencer_directory
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Influencer reads own deal" ON public.influencer_deals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.influencer_directory d
            WHERE d.id = influencer_deals.influencer_id AND d.user_id = auth.uid())
  );
CREATE POLICY "Influencer reads own deliverables" ON public.influencer_deliverables
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.influencer_directory d
            WHERE d.id = influencer_deliverables.influencer_id AND d.user_id = auth.uid())
  );

-- Einreichen ja, freigeben nein: die Zeile muss danach 'submitted' sein.
CREATE POLICY "Influencer submits own proof" ON public.influencer_deliverables
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.influencer_directory d
            WHERE d.id = influencer_deliverables.influencer_id AND d.user_id = auth.uid())
  )
  WITH CHECK (status = 'submitted');

COMMENT ON TABLE public.influencer_directory IS
  'Influencer-Verzeichnis der Akquise. Getrennt von agency_directory; keine oeffentliche Leseregel (personenbezogene Daten).';
COMMENT ON COLUMN public.influencer_deals.reward_kinds IS
  'Mehrere Gegenleistungen gleichzeitig moeglich: trial | unlimited | commission | fee (Werte aus src/lib/influencer-status.ts).';
