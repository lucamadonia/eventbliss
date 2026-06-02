-- OHRWURM — vom Admin pflegbare Songs (ergänzen die statische 1281er-Liste).
-- Pro Sprache zuschaltbar; mit vorab aufgelöster Spotify-Track-URI.

CREATE TABLE IF NOT EXISTS public.ohrwurm_songs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year        integer NOT NULL,
  artist      text NOT NULL,
  title       text NOT NULL,
  country     text NOT NULL DEFAULT '🌍',   -- Flaggen-Emoji
  genre       text NOT NULL DEFAULT 'Pop',
  language    text NOT NULL DEFAULT 'de',    -- Sprach-Code (de/en/es/…); Filter im Spiel
  spotify_uri text,                          -- "spotify:track:…" (optional)
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ohrwurm_songs_active_lang
  ON public.ohrwurm_songs (is_active, language);

ALTER TABLE public.ohrwurm_songs ENABLE ROW LEVEL SECURITY;

-- Alle dürfen aktive Songs lesen (das Spiel ist öffentlich).
DROP POLICY IF EXISTS "Everyone can read active ohrwurm songs" ON public.ohrwurm_songs;
CREATE POLICY "Everyone can read active ohrwurm songs"
  ON public.ohrwurm_songs FOR SELECT USING (is_active = true);

-- Nur Admins dürfen schreiben.
DROP POLICY IF EXISTS "Admins manage ohrwurm songs" ON public.ohrwurm_songs;
CREATE POLICY "Admins manage ohrwurm songs"
  ON public.ohrwurm_songs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
