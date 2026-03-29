-- ============================================
-- Complete Agency Platform Tables
-- ============================================

-- 1. Agencies (Organization Entity)
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  accent_color TEXT DEFAULT '#06B6D4',
  custom_domain TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'DE',
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter','professional','enterprise')),
  max_members INT DEFAULT 5,
  max_events INT DEFAULT 10,
  storage_limit_gb INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agencies_owner ON public.agencies(owner_id);
CREATE INDEX idx_agencies_slug ON public.agencies(slug);

CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Agency Members
CREATE TABLE public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('owner','admin','manager','assistant')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','deactivated')),
  invite_token UUID DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, email)
);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agency_members_agency ON public.agency_members(agency_id);
CREATE INDEX idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX idx_agency_members_email ON public.agency_members(email);
CREATE INDEX idx_agency_members_invite ON public.agency_members(invite_token);

CREATE TRIGGER update_agency_members_updated_at
BEFORE UPDATE ON public.agency_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Agency Notifications
CREATE TABLE public.agency_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deadline','task','budget','team','vendor','system')),
  title TEXT NOT NULL,
  description TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agency_notifications_user ON public.agency_notifications(user_id);
CREATE INDEX idx_agency_notifications_agency ON public.agency_notifications(agency_id);

-- 4. Client Access Tokens
CREATE TABLE public.client_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_name TEXT,
  client_email TEXT,
  permissions JSONB DEFAULT '{"view_timeline":true,"view_budget_summary":true,"view_files":false,"approve_milestones":false}'::jsonb,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_client_tokens_event ON public.client_access_tokens(event_id);
CREATE INDEX idx_client_tokens_token ON public.client_access_tokens(token);

-- 5. Add agency_id to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_agency ON public.events(agency_id);

-- 6. RLS Policies

-- Helper: check if user is member of agency
CREATE OR REPLACE FUNCTION public.is_agency_member(_user_id UUID, _agency_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = _agency_id AND user_id = _user_id AND status = 'active'
  )
$$;

-- Helper: get user's agency id
CREATE OR REPLACE FUNCTION public.get_user_agency_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT agency_id FROM public.agency_members
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

-- Agencies: owner + members can view, only owner can update
CREATE POLICY "Agency members can view own agency"
ON public.agencies FOR SELECT
USING (public.is_agency_member(auth.uid(), id) OR owner_id = auth.uid());

CREATE POLICY "Agency owner can manage"
ON public.agencies FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Agency Members: members can view, admin+ can manage
CREATE POLICY "Members can view team"
ON public.agency_members FOR SELECT
USING (public.is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Admins can manage members"
ON public.agency_members FOR ALL
USING (
  agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid())
  OR (public.is_agency_member(auth.uid(), agency_id) AND
      EXISTS (SELECT 1 FROM public.agency_members WHERE agency_id = agency_members.agency_id AND user_id = auth.uid() AND role IN ('owner','admin')))
);

-- Anyone can claim invite by token
CREATE POLICY "Claim invite by token"
ON public.agency_members FOR UPDATE
USING (invite_token IS NOT NULL AND status = 'invited');

-- Notifications: user sees own notifications
CREATE POLICY "Users see own notifications"
ON public.agency_notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users manage own notifications"
ON public.agency_notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.agency_notifications FOR INSERT
WITH CHECK (true);

-- Client tokens: agency members can manage
CREATE POLICY "Agency members manage client tokens"
ON public.client_access_tokens FOR ALL
USING (public.is_agency_member(auth.uid(), agency_id));

-- Create storage bucket for event files
-- Note: This needs to be done via Supabase Dashboard or CLI, not SQL
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-files', 'event-files', false);
