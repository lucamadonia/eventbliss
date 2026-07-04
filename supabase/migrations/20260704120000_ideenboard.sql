-- Ideenboard: collaborative per-event moodboard (Premium feature).
-- Tables: event_boards, board_pins, board_pin_reactions, board_pin_comments.
-- Access model mirrors the existing event pattern: an event ORGANIZER
-- (public.is_event_organizer) or a PARTICIPANT with a user account
-- (participants.user_id = auth.uid()) may read/contribute. Board settings
-- (contribute mode, guest flags, cover) are organizer-only. Contribute-mode /
-- guest / free-pin-limit business rules are enforced in the app layer; RLS is
-- the hard membership boundary. Idempotent (safe to re-run).

-- ── access predicate ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_access_event_board(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_event_organizer(_user_id, _event_id)
    OR EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.event_id = _event_id AND p.user_id = _user_id
    );
$$;

-- ── event_boards ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_boards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title            text NOT NULL DEFAULT 'Ideenboard',
  cover_pin_id     uuid,
  contribute_mode  text NOT NULL DEFAULT 'contribute'
                     CHECK (contribute_mode IN ('contribute','view','private')),
  guests_can_view  boolean NOT NULL DEFAULT false,
  guests_can_pin   boolean NOT NULL DEFAULT false,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_boards_event ON public.event_boards(event_id);

-- ── board_pins ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_pins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid NOT NULL REFERENCES public.event_boards(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kind        text NOT NULL DEFAULT 'note'
                CHECK (kind IN ('image','link','note','embed')),
  category    text NOT NULL DEFAULT 'deko'
                CHECK (category IN ('deko','outfit','food','drinks','activity','location','gift','playlist','other')),
  title       text,
  note        text,
  url         text,
  image_path  text,
  embed_html  text,
  source      text NOT NULL DEFAULT 'user' CHECK (source IN ('user','seed','ai')),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_board_pins_board    ON public.board_pins(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_pins_creator  ON public.board_pins(board_id, created_by);

-- ── reactions & comments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_pin_reactions (
  pin_id     uuid NOT NULL REFERENCES public.board_pins(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      text NOT NULL DEFAULT '❤️',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pin_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.board_pin_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id     uuid NOT NULL REFERENCES public.board_pins(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_board_comments_pin ON public.board_pin_comments(pin_id, created_at);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.event_boards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_pins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_pin_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_pin_comments  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- event_boards: members read; organizer manages
  CREATE POLICY board_select ON public.event_boards FOR SELECT
    USING (public.can_access_event_board(auth.uid(), event_id));
  CREATE POLICY board_insert ON public.event_boards FOR INSERT
    WITH CHECK (public.can_access_event_board(auth.uid(), event_id));
  CREATE POLICY board_update ON public.event_boards FOR UPDATE
    USING (public.is_event_organizer(auth.uid(), event_id));
  CREATE POLICY board_delete ON public.event_boards FOR DELETE
    USING (public.is_event_organizer(auth.uid(), event_id));

  -- board_pins: members read; members add their own; author or organizer removes
  CREATE POLICY pin_select ON public.board_pins FOR SELECT
    USING (public.can_access_event_board(auth.uid(), event_id));
  CREATE POLICY pin_insert ON public.board_pins FOR INSERT
    WITH CHECK (public.can_access_event_board(auth.uid(), event_id) AND created_by = auth.uid());
  CREATE POLICY pin_update ON public.board_pins FOR UPDATE
    USING (created_by = auth.uid() OR public.is_event_organizer(auth.uid(), event_id));
  CREATE POLICY pin_delete ON public.board_pins FOR DELETE
    USING (created_by = auth.uid() OR public.is_event_organizer(auth.uid(), event_id));

  -- reactions: members read; users manage their own
  CREATE POLICY react_select ON public.board_pin_reactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.board_pins bp WHERE bp.id = pin_id
                   AND public.can_access_event_board(auth.uid(), bp.event_id)));
  CREATE POLICY react_insert ON public.board_pin_reactions FOR INSERT
    WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.board_pins bp WHERE bp.id = pin_id
                   AND public.can_access_event_board(auth.uid(), bp.event_id)));
  CREATE POLICY react_delete ON public.board_pin_reactions FOR DELETE
    USING (user_id = auth.uid());

  -- comments: members read; members add their own; author or organizer removes
  CREATE POLICY comment_select ON public.board_pin_comments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.board_pins bp WHERE bp.id = pin_id
                   AND public.can_access_event_board(auth.uid(), bp.event_id)));
  CREATE POLICY comment_insert ON public.board_pin_comments FOR INSERT
    WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.board_pins bp WHERE bp.id = pin_id
                   AND public.can_access_event_board(auth.uid(), bp.event_id)));
  CREATE POLICY comment_delete ON public.board_pin_comments FOR DELETE
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.board_pins bp WHERE bp.id = pin_id
                   AND public.is_event_organizer(auth.uid(), bp.event_id)));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── realtime ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.board_pins;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.board_pin_reactions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.board_pin_comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── storage bucket for pin images ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('board-pins', 'board-pins', true, 10485760,
        ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY board_pins_read ON storage.objects FOR SELECT
    USING (bucket_id = 'board-pins');
  CREATE POLICY board_pins_upload ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'board-pins' AND auth.uid() IS NOT NULL);
  CREATE POLICY board_pins_delete ON storage.objects FOR DELETE
    USING (bucket_id = 'board-pins' AND owner = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
