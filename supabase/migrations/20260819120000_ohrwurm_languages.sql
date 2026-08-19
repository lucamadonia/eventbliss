-- OHRWURM — Songs mehreren Sprachfassungen zuordnen.
--
-- Bisher hielt `language` genau EINEN Wert: entweder einen Sprachcode oder den
-- Sentinel '*' ("alle"). Damit ließ sich nicht ausdrücken, was tatsächlich
-- gebraucht wird — ein Song ist selten nur in einem Markt bekannt und selten in
-- allen zehn. ABBA gehört überall hin, ein polnischer Titel nur nach Polen,
-- ein Schlager nach DE/AT/CH.
--
-- Neue Spalte `languages text[]`. Semantik:
--   ['*']              → in allen zehn Sprachfassungen spielbar
--   ['de','nl']        → nur dort
--   []                 → nirgends (faktisch deaktiviert)
--
-- Abgefragt wird mit dem Overlap-Operator && gegen [<aktive Sprache>, '*'].

ALTER TABLE public.ohrwurm_songs
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';

-- Bestand übernehmen: der bisherige Einzelwert wird zum ersten Arrayeintrag.
UPDATE public.ohrwurm_songs
SET languages = ARRAY[language]
WHERE languages = '{}' AND language IS NOT NULL;

-- GIN-Index für den Overlap-Operator; ohne ihn wird bei 1281+ Zeilen jedes
-- Spiel-Laden zum Full-Table-Scan.
CREATE INDEX IF NOT EXISTS idx_ohrwurm_songs_languages
  ON public.ohrwurm_songs USING GIN (languages);

-- `language` bleibt vorerst bestehen (Altbestand, Rückfallebene), wird vom
-- Spiel aber nicht mehr gelesen. Bewusst nicht gelöscht: ein bereits
-- ausgelieferter Client könnte die Spalte noch erwarten.
COMMENT ON COLUMN public.ohrwurm_songs.language IS
  'Veraltet — durch languages[] ersetzt. Nur noch für Altclients vorhanden.';
COMMENT ON COLUMN public.ohrwurm_songs.languages IS
  'Sprachfassungen, in denen der Song erscheint. [''*''] = alle zehn.';
