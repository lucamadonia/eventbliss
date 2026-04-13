-- ============================================
-- Calendar Tokens for iCal Feed Subscriptions
-- Allows agencies/guides to share calendar feeds
-- ============================================

CREATE TABLE public.calendar_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES agency_members(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  scope TEXT DEFAULT 'all' CHECK (scope IN ('all', 'confirmed_only', 'guide_personal')),
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendar_tokens_token ON public.calendar_tokens(token);

ALTER TABLE public.calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage their tokens"
  ON public.calendar_tokens FOR ALL
  USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access on calendar_tokens"
  ON public.calendar_tokens FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
