-- Create table for manual credit adjustments by admins
CREATE TABLE public.ai_credit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_ai_credit_adjustments_user_month ON public.ai_credit_adjustments (user_id, created_at);

-- Enable RLS
ALTER TABLE public.ai_credit_adjustments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all adjustments
CREATE POLICY "Admins can manage adjustments" ON public.ai_credit_adjustments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own adjustments
CREATE POLICY "Users can view own adjustments" ON public.ai_credit_adjustments
  FOR SELECT USING (auth.uid() = user_id);