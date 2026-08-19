-- OHRWURM — Felder für die Chart-Pipeline.
--
-- Bisher wusste die Tabelle nicht, WOHER ein Song stammt und in welchen Ländern
-- er tatsächlich lief. Die Marktzuordnung beruhte auf dem Herkunftsland des
-- Künstlers — was Herkunft mit Charterfolg verwechselt.

ALTER TABLE public.ohrwurm_songs
  -- Dedup-Schlüssel der Pipeline. Stabil, eindeutig, sprachunabhängig.
  -- Nur Songs, die iTunes bestätigt hat, bekommen eine ID; darum NULL erlaubt
  -- (die 1281 Altbestandssongs haben keine).
  ADD COLUMN IF NOT EXISTS itunes_track_id bigint,
  -- Exaktes Datum statt nur `year`. Für ein Jahres-Ratespiel ist die Genauigkeit
  -- entscheidend: Neuveröffentlichungen und Best-of-Alben tragen sonst das
  -- falsche Jahr und machen die Runde unfair.
  ADD COLUMN IF NOT EXISTS release_date date,
  -- Vorab aufgelöste iTunes-Vorschau. Damit entfällt der Netzaufruf PRO RUNDE —
  -- genau die Stelle, an der die stummen Runden entstanden, weil iTunes bei
  -- ~20 Anfragen/Minute pro IP drosselt.
  ADD COLUMN IF NOT EXISTS preview_url text,
  ADD COLUMN IF NOT EXISTS artwork_url text,
  -- In welchen Ländern der Titel charted hat. Grundlage der Sprachzuordnung:
  -- ab vier von zehn Sprachmärkten gilt er als Welthit.
  ADD COLUMN IF NOT EXISTS chart_markets text[] NOT NULL DEFAULT '{}',
  -- Herkunft: 'apple-rss' | 'wikipedia' | 'base' | 'manual'.
  -- 'manual' schützt vor Überschreiben durch die Pipeline.
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'base';

-- Eindeutig, damit `upsert(onConflict: 'itunes_track_id')` möglich wird.
-- Partiell, weil der gesamte Altbestand NULL trägt.
CREATE UNIQUE INDEX IF NOT EXISTS ohrwurm_songs_itunes_track_id_key
  ON public.ohrwurm_songs (itunes_track_id)
  WHERE itunes_track_id IS NOT NULL;

-- Normalisierter Zweitschlüssel, um Neuzugänge gegen den Altbestand zu prüfen
-- (der hat keine iTunes-ID).
--
-- BEWUSST NICHT UNIQUE: der Altbestand enthält legitime Beinah-Dubletten wie
-- „Lean On" unter drei verschiedenen Interpreten-Schreibweisen. Ein Unique-Index
-- würde die Migration daran scheitern lassen. Die Entscheidung, ob etwas eine
-- Dublette ist, trifft das Skript — mit Kontext, den die Datenbank nicht hat.
CREATE INDEX IF NOT EXISTS idx_ohrwurm_songs_norm
  ON public.ohrwurm_songs (
    lower(regexp_replace(artist || '|' || title, '[^a-zA-Z0-9]', '', 'g'))
  );

-- Die tatsächliche Spielabfrage lautet `is_active = true AND languages && [...]`.
-- Der vorhandene GIN-Index deckt nur den Array-Teil ab.
CREATE INDEX IF NOT EXISTS idx_ohrwurm_songs_active_languages
  ON public.ohrwurm_songs USING GIN (languages)
  WHERE is_active;

-- Der alte Index zeigt auf die veraltete Spalte `language`, die nicht mehr
-- abgefragt wird.
DROP INDEX IF EXISTS idx_ohrwurm_songs_active_lang;

-- `updated_at` existierte, wurde aber nie aktualisiert.
CREATE OR REPLACE FUNCTION public.touch_ohrwurm_songs()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ohrwurm_songs_touch ON public.ohrwurm_songs;
CREATE TRIGGER trg_ohrwurm_songs_touch
  BEFORE UPDATE ON public.ohrwurm_songs
  FOR EACH ROW EXECUTE FUNCTION public.touch_ohrwurm_songs();

COMMENT ON COLUMN public.ohrwurm_songs.itunes_track_id IS
  'iTunes trackId — Dedup-Schlüssel der Chart-Pipeline.';
COMMENT ON COLUMN public.ohrwurm_songs.chart_markets IS
  'Ländercodes, in deren Charts der Titel stand (z. B. {DE,AT,US}).';
COMMENT ON COLUMN public.ohrwurm_songs.source IS
  'apple-rss | wikipedia | base | manual. "manual" wird nie überschrieben.';
