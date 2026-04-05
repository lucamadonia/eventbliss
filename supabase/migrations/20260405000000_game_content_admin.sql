-- Dynamic game content (managed via admin portal)
CREATE TABLE IF NOT EXISTS public.game_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id text NOT NULL,
  content_type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  difficulty text DEFAULT 'medium',
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_content_game ON public.game_content(game_id);
CREATE INDEX IF NOT EXISTS idx_game_content_type ON public.game_content(content_type);
CREATE INDEX IF NOT EXISTS idx_game_content_active ON public.game_content(is_active);

ALTER TABLE public.game_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read active content" ON public.game_content FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all content" ON public.game_content FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
