-- ============================================
-- Admin Portal Extended: audit log + feature flags + system settings
-- ============================================

-- 1. Audit Log — track every admin action
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,          -- e.g. 'agency.tier.override', 'user.ban', 'service.approve'
  target_type TEXT,              -- e.g. 'agency', 'user', 'service'
  target_id TEXT,                -- UUID or primary key as text
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit entries"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Feature Flags — runtime toggles
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,                 -- e.g. 'new_onboarding', 'tv_mode_beta'
  name TEXT NOT NULL,                       -- human-readable label
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_tiers TEXT[] DEFAULT NULL,         -- null = everyone, else limit to 'free','premium','professional','enterprise'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(is_enabled);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can READ enabled flags (needed for client-side feature gating)
CREATE POLICY "Public read of feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some example flags
INSERT INTO public.feature_flags (key, name, description, is_enabled) VALUES
  ('new_agency_dashboard', 'New Agency Dashboard', 'Enable the tier-aware agency dashboard with locked modules', true),
  ('ai_planner_v2', 'AI Planner v2', 'Next-gen AI planning with 7 assistant types', false),
  ('tv_mode_beta', 'TV Mode Beta', 'Full-screen TV mode for party games', true),
  ('marketplace_auto_approve', 'Marketplace Auto-Approve', 'Auto-approve marketplace listings without admin review', false),
  ('agency_welcome_flow', 'Agency Welcome Flow', 'Show welcome banner after agency signup', true)
ON CONFLICT (key) DO NOTHING;

-- 3. System Settings — key-value store for runtime config
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,                   -- 'email', 'billing', 'security', 'platform'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT false, -- if true, never expose to non-admin reads
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage system settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial non-secret settings
INSERT INTO public.system_settings (category, key, value, description, is_secret) VALUES
  ('platform', 'maintenance_mode', 'false'::jsonb, 'Put platform in maintenance mode', false),
  ('platform', 'signup_enabled', 'true'::jsonb, 'Allow new user signups', false),
  ('platform', 'agency_apply_enabled', 'true'::jsonb, 'Allow new agency applications', false),
  ('email', 'from_name', '"EventBliss"'::jsonb, 'Display name for all outgoing emails', false),
  ('email', 'from_address', '"noreply@event-bliss.com"'::jsonb, 'From-address for all outgoing emails', false),
  ('email', 'reply_to', '"info@event-bliss.com"'::jsonb, 'Default reply-to address', false),
  ('billing', 'stripe_test_mode', 'false'::jsonb, 'Use Stripe test-mode keys', false),
  ('billing', 'launch_discount_percent', '50'::jsonb, 'Launch discount shown on pricing pages', false),
  ('security', 'require_email_verification', 'true'::jsonb, 'Require email verification on signup', false),
  ('security', 'max_signups_per_hour_per_ip', '5'::jsonb, 'Anti-abuse signup rate limit', false)
ON CONFLICT (category, key) DO NOTHING;

-- Helper function: admins can log audit events easily
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (admin_user_id, admin_email, action, target_type, target_id, metadata)
  VALUES (auth.uid(), v_email, p_action, p_target_type, p_target_id, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT, JSONB) TO authenticated;
