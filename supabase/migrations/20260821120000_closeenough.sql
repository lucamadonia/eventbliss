-- CLOSE ENOUGH (deutsch: Nah Dran) — Schätzfragen mit einer Zahl als Antwort.
--
-- Eigene Tabelle, gleiche Begründung wie bei PIXELJAGD: mehrsprachige Namen,
-- ein Pflichtbeleg und ein numerisches Antwortfeld rechtfertigen ein eigenes
-- Schema. Der generische game_content-Cache stringifyt Zeilen nach
-- localStorage, wo eine numeric-Spalte still zu einem String würde.
--
-- Der FRAGETEXT steht nicht in der Tabelle. Gespeichert sind der
-- Vorlagenschlüssel (`frame_key`) und der Name des Gegenstands in bis zu zehn
-- Sprachen; die Frage entsteht zur Laufzeit aus
--   t('games.closeenough.frames.' || frame_key, { name: name_i18n[lang] }).
-- Damit kostet eine neue Frage null Übersetzungsaufwand — nur einen Namen, den
-- Wikidata ohnehin zehnsprachig führt. 29 Vorlagen mal zehn Sprachen sind 290
-- Sätze statt rund 8700 übersetzter Fragen.
--
-- Ausnahme ist die handverlesene Kategorie `alltag`: dort trägt `question_i18n`
-- den ganzen Satz und `frame_key` den Sentinel 'custom'.

CREATE TABLE IF NOT EXISTS public.closeenough_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Name des Gegenstands je Sprache: {"de":"Barcelona","en":"Barcelona",...}.
  -- Füllt das {{name}} der Vorlage. Bei frame_key='custom' leer.
  name_i18n     jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Vollständiger Fragesatz je Sprache. NUR für frame_key='custom'.
  question_i18n jsonb,

  -- i18n-Schlüssel der Vorlage, ohne Präfix: 'population', 'height_structure'.
  frame_key     text NOT NULL,

  -- Die Antwort. numeric, nicht double precision: 1620343 muss exakt bleiben,
  -- und bei Baukosten in Millionen zählen die Nachkommastellen.
  --
  -- ACHTUNG für die Client-Seite: supabase-js liefert numeric als STRING.
  -- Ohne Number() vergleicht das Spiel lexikografisch, und der Punktestand
  -- wird stiller Unsinn — nichts stürzt ab, es wird nur falsch gewertet.
  answer        numeric NOT NULL,

  -- i18n-Schlüssel der Einheit ('m','km2','people'). Der Wert ist bereits
  -- normalisiert — in der Spalte steht nie ein Fuß- oder Meilenwert.
  unit_key      text NOT NULL,
  category      text NOT NULL,

  -- Prozentradius um `answer` für den Volltreffer-Bonus. KEIN Filter bei der
  -- Wertung: gewertet wird immer der nächste Tipp, die Toleranz gibt nur den
  -- Extrapunkt.
  tolerance_pct numeric(5,2) NOT NULL DEFAULT 10,

  -- Bezugsjahr bei zeitabhängigen Größen (Einwohner, Umsatz, Besucher).
  -- Steht im Fragetext, sonst wirkt jede richtige Antwort falsch.
  as_of_year    smallint,

  difficulty    smallint NOT NULL DEFAULT 2,

  -- Beleg. Pflicht, wie pixel_images.credit: bei einer Zahl ist die Herkunft
  -- die einzige Möglichkeit, einen Streit am Spieltisch zu beenden.
  source_label  text NOT NULL,
  source_url    text,

  -- Herkunft aus der Pipeline. NULL bei handverlesenen Zeilen.
  wikidata_qid      text,
  wikidata_property text,

  -- Sprachfassungen, in denen die Frage spielbar ist. Semantik wie bei
  -- ohrwurm_songs.languages: ['*'] = alle zehn. Abgefragt mit && gegen
  -- [<aktive Sprache>, '*'].
  languages     text[] NOT NULL DEFAULT '{}',

  is_active     boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT closeenough_category_check CHECK (category IN
    ('laender','bauwerke','natur','tierwelt','sport','technik','alltag')),

  CONSTRAINT closeenough_frame_key_check
    CHECK (frame_key ~ '^[a-z][a-z0-9_]{2,39}$'),

  CONSTRAINT closeenough_unit_key_check CHECK (unit_key IN (
    'people','km2','m','km','cm','kg','t','kmh','year','years','seats',
    'floors','pieces','members','goals','matches','usd','mrd_usd','mio_eur',
    'm3s','volt','percent','liter','steps','beats','times','count')),

  -- numeric kennt NaN, und NaN = NaN ist bei numeric TRUE — deshalb schlägt
  -- `answer = answer` als Test fehl und es braucht den expliziten Vergleich.
  CONSTRAINT closeenough_answer_finite_check
    CHECK (answer <> 'NaN'::numeric AND abs(answer) < 1e15),

  -- Negative Antworten ergeben nur bei Jahreszahlen Sinn (v. Chr.).
  CONSTRAINT closeenough_answer_sign_check
    CHECK (answer > 0 OR unit_key = 'year'),

  CONSTRAINT closeenough_tolerance_check
    CHECK (tolerance_pct > 0 AND tolerance_pct <= 100),

  CONSTRAINT closeenough_difficulty_check CHECK (difficulty BETWEEN 1 AND 3),

  CONSTRAINT closeenough_as_of_year_check
    CHECK (as_of_year IS NULL OR as_of_year BETWEEN 1900 AND 2100),

  CONSTRAINT closeenough_source_check CHECK (length(btrim(source_label)) > 0),

  CONSTRAINT closeenough_languages_check CHECK (cardinality(languages) > 0),

  -- Entweder Vorlage + Name oder Sentinel + fertiger Satz. Nie beides, nie
  -- keines von beidem: sonst gäbe es zur Laufzeit eine Frage ohne Text.
  CONSTRAINT closeenough_text_source_check CHECK (
    (frame_key <> 'custom'
       AND name_i18n ? 'de'
       AND length(btrim(name_i18n->>'de')) > 0
       AND question_i18n IS NULL)
    OR
    (frame_key = 'custom'
       AND question_i18n ? 'de'
       AND length(btrim(question_i18n->>'de')) > 0)
  )
);

-- Deckt den einzigen Ladepfad des Spiels ab: aktive Zeilen einer Kategorie.
CREATE INDEX IF NOT EXISTS closeenough_questions_active_category_idx
  ON public.closeenough_questions (category) WHERE is_active;

-- Ohne GIN wird der &&-Overlap bei rund 1000 Zeilen zum Full-Table-Scan;
-- gleiche Begründung wie bei idx_ohrwurm_songs_languages.
CREATE INDEX IF NOT EXISTS closeenough_questions_languages_idx
  ON public.closeenough_questions USING GIN (languages);

-- Netz gegen doppelte Läufe der Pipeline: dieselbe Entität darf dieselbe
-- Eigenschaft nur einmal liefern. Handverlesene Zeilen sind ausgenommen.
CREATE UNIQUE INDEX IF NOT EXISTS closeenough_questions_source_uniq
  ON public.closeenough_questions (wikidata_qid, frame_key)
  WHERE wikidata_qid IS NOT NULL;

ALTER TABLE public.closeenough_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS closeenough_questions_read ON public.closeenough_questions;
CREATE POLICY closeenough_questions_read ON public.closeenough_questions
  FOR SELECT USING (is_active = true);

-- FOR ALL mit explizitem WITH CHECK. Ohne WITH CHECK zieht PostgreSQL zwar den
-- USING-Ausdruck als Prüfung heran, aber die Absicht steht dann nirgends
-- geschrieben — und wer später USING lockert, öffnet unbemerkt das
-- Schreibrecht mit. (pixel_images_admin_all ist genau in dieser Lage.)
DROP POLICY IF EXISTS closeenough_questions_admin_all ON public.closeenough_questions;
CREATE POLICY closeenough_questions_admin_all ON public.closeenough_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.closeenough_questions IS
  'Schaetzfragen fuer CLOSE ENOUGH (deutsch: Nah Dran).';
COMMENT ON COLUMN public.closeenough_questions.frame_key IS
  'i18n-Schluessel der Fragevorlage. ''custom'' = Text steht in question_i18n.';
COMMENT ON COLUMN public.closeenough_questions.languages IS
  'Sprachfassungen, in denen die Frage erscheint. [''*''] = alle zehn.';
COMMENT ON COLUMN public.closeenough_questions.tolerance_pct IS
  'Prozentradius fuer den Volltreffer-Bonus, nicht fuer die Wertung selbst.';
