-- Agency Directory: Stores all known JGA agencies (previously static in agencies-data.ts)
-- This table is the central directory for external agencies that can be invited as partners.

CREATE TABLE IF NOT EXISTS public.agency_directory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country TEXT NOT NULL DEFAULT 'Deutschland',
  country_code TEXT NOT NULL DEFAULT 'DE',
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  website TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'partner', 'inactive')),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast search
CREATE INDEX IF NOT EXISTS idx_agency_directory_country ON public.agency_directory(country_code);
CREATE INDEX IF NOT EXISTS idx_agency_directory_city ON public.agency_directory(city);
CREATE INDEX IF NOT EXISTS idx_agency_directory_status ON public.agency_directory(status);
CREATE INDEX IF NOT EXISTS idx_agency_directory_name ON public.agency_directory USING gin(to_tsvector('german', name));

-- RLS
ALTER TABLE public.agency_directory ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on agency_directory"
  ON public.agency_directory
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Public can read active agencies
CREATE POLICY "Public read active agencies"
  ON public.agency_directory
  FOR SELECT
  USING (status = 'active' OR status = 'partner');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_agency_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agency_directory_updated_at
  BEFORE UPDATE ON public.agency_directory
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_directory_updated_at();
