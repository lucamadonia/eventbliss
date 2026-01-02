-- Create ai_usage table to track AI credits consumption
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast monthly queries
CREATE INDEX idx_ai_usage_user_month ON public.ai_usage (user_id, created_at);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all usage" ON public.ai_usage
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert usage (via service role in edge functions)
CREATE POLICY "Anyone can insert usage" ON public.ai_usage
  FOR INSERT WITH CHECK (true);