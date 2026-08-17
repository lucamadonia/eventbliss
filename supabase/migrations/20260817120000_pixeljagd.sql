-- PIXELJAGD — Bildmotive für das Verpixel-Ratespiel.
--
-- Eigene Tabelle statt der generischen `game_content`, weil ein Bildpfad,
-- Aliase, ein Pflicht-Bildnachweis und mehrsprachige Antworten ein eigenes
-- Schema rechtfertigen — und weil der generische Cache-Loader seine Rows
-- komplett nach localStorage JSON-stringifyt, wo Bilddaten nichts verloren
-- haben. Vorbild: 20260602120000_ohrwurm_songs.sql.

CREATE TABLE IF NOT EXISTS public.pixel_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Pfad im Bucket `game-images` ODER ein same-origin Pfad unter /images/.
  -- WICHTIG: niemals ein fremder Host — ein fremdgehostetes Bild taintet den
  -- Canvas, und die Verpixelung braucht getImageData().
  image_path  text NOT NULL,
  -- Antworten pro Sprache: {"de":"Löwe","en":"Lion",...}. `de` ist Pflicht.
  answers     jsonb NOT NULL DEFAULT '{}'::jsonb,
  aliases     text[] NOT NULL DEFAULT '{}',
  category    text NOT NULL,
  difficulty  smallint NOT NULL DEFAULT 2,
  -- Bildnachweis. Pflicht und im Spiel sichtbar: das Impressum verspricht,
  -- Fremdinhalte zu kennzeichnen, und bei Stars/Marken ist die Herkunft die
  -- entscheidende Information.
  credit      text NOT NULL,
  source_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pixel_images_category_check
    CHECK (category IN ('tiere','stars','filme','essen','orte','marken')),
  CONSTRAINT pixel_images_difficulty_check
    CHECK (difficulty BETWEEN 1 AND 3),
  CONSTRAINT pixel_images_credit_check
    CHECK (length(btrim(credit)) > 0),
  CONSTRAINT pixel_images_answers_de_check
    CHECK (answers ? 'de' AND length(btrim(answers->>'de')) > 0)
);

CREATE INDEX IF NOT EXISTS pixel_images_active_category_idx
  ON public.pixel_images (category) WHERE is_active;

ALTER TABLE public.pixel_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pixel_images_read ON public.pixel_images;
CREATE POLICY pixel_images_read ON public.pixel_images
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS pixel_images_admin_all ON public.pixel_images;
CREATE POLICY pixel_images_admin_all ON public.pixel_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- --------------------------------------------------------------------------
-- Storage: öffentlicher Bucket, damit die Bilder über die Supabase-Domain
-- ausgeliefert werden — die steht in der connect-src-Allowlist und ist damit
-- canvas-tauglich. Vorbild: board-pins aus 20260704120000_ideenboard.sql.
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('game-images', 'game-images', true, 10485760,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS game_images_read ON storage.objects;
CREATE POLICY game_images_read ON storage.objects
  FOR SELECT USING (bucket_id = 'game-images');

DROP POLICY IF EXISTS game_images_admin_write ON storage.objects;
CREATE POLICY game_images_admin_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS game_images_admin_delete ON storage.objects;
CREATE POLICY game_images_admin_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
