-- Plan configurations table for dynamic credit limits and features
CREATE TABLE public.plan_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  ai_credits_monthly INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER DEFAULT 0,
  price_currency TEXT DEFAULT 'EUR',
  billing_interval TEXT,
  stripe_price_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan_configs
CREATE POLICY "Anyone can view active plans"
ON public.plan_configs
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plan configs"
ON public.plan_configs
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert initial plan data
INSERT INTO public.plan_configs (plan_key, display_name, ai_credits_monthly, price_cents, billing_interval, features, sort_order) VALUES
('free', 'Free', 0, 0, NULL, '["basic_planning"]'::jsonb, 0),
('monthly', 'Monthly', 50, 999, 'month', '["ai_assistant", "expense_tracking", "team_management"]'::jsonb, 1),
('yearly', 'Yearly', 100, 7999, 'year', '["ai_assistant", "expense_tracking", "team_management", "priority_support"]'::jsonb, 2),
('lifetime', 'Lifetime', 75, 19900, NULL, '["ai_assistant", "expense_tracking", "team_management", "priority_support", "lifetime_updates"]'::jsonb, 3);

-- Admin messages table for support communication
CREATE TABLE public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_messages
CREATE POLICY "Admins can manage messages"
ON public.admin_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own messages"
ON public.admin_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Add columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Trigger for plan_configs updated_at
CREATE TRIGGER update_plan_configs_updated_at
BEFORE UPDATE ON public.plan_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();