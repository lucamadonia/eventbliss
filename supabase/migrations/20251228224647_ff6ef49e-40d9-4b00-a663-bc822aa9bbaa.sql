-- STAG Multi-Event Platform Database Schema
-- Phase 1: Core multi-tenant architecture

-- ============================================
-- USER ROLES SYSTEM (Security)
-- ============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'organizer', 'member');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS: Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EVENTS TABLE (Core multi-tenant entity)
-- ============================================

CREATE TYPE public.event_status AS ENUM ('draft', 'planning', 'active', 'completed', 'cancelled');
CREATE TYPE public.event_type AS ENUM ('bachelor', 'bachelorette', 'birthday', 'trip', 'other');

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique slug for URL (e.g., /e/jga-dominik-2026)
    slug TEXT NOT NULL UNIQUE,
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    event_type event_type NOT NULL DEFAULT 'bachelor',
    status event_status NOT NULL DEFAULT 'planning',
    
    -- Person of honor
    honoree_name TEXT NOT NULL,
    
    -- Dates
    event_date DATE,
    survey_deadline TIMESTAMPTZ,
    
    -- Access control
    access_code TEXT, -- Optional access code for private events
    is_public BOOLEAN DEFAULT false,
    
    -- Customization (JSON for flexibility)
    theme JSONB DEFAULT '{}', -- colors, images, fonts
    settings JSONB DEFAULT '{}', -- no-gos, focus points, rules
    
    -- Localization
    locale TEXT DEFAULT 'de',
    currency TEXT DEFAULT 'EUR',
    timezone TEXT DEFAULT 'Europe/Berlin',
    
    -- Creator
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Index for slug lookups
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_status ON public.events(status);

-- ============================================
-- PARTICIPANTS TABLE
-- ============================================

CREATE TYPE public.participant_role AS ENUM ('organizer', 'guest');
CREATE TYPE public.participant_status AS ENUM ('invited', 'confirmed', 'declined', 'maybe');

CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    
    -- User link (optional - guests can be anonymous)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Basic info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    
    -- Role and status
    role participant_role NOT NULL DEFAULT 'guest',
    status participant_status NOT NULL DEFAULT 'invited',
    
    -- Survey response reference
    response_id UUID, -- Will link to responses table
    
    -- Timestamps
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique constraint: one user per event
    UNIQUE(event_id, email),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_participants_event ON public.participants(event_id);
CREATE INDEX idx_participants_user ON public.participants(user_id);
CREATE INDEX idx_participants_email ON public.participants(email);

-- ============================================
-- UPDATE RESPONSES TABLE (Add event_id)
-- ============================================

-- Add event_id to existing responses table
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_responses_event ON public.responses(event_id);

-- ============================================
-- EXPENSES TABLE (Cost Splitting)
-- ============================================

CREATE TYPE public.expense_category AS ENUM (
    'transport', 'accommodation', 'activities', 
    'food', 'drinks', 'gifts', 'other'
);

CREATE TYPE public.split_type AS ENUM ('equal', 'custom', 'percentage');

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    
    -- Who paid
    paid_by_participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Details
    description TEXT NOT NULL,
    category expense_category NOT NULL DEFAULT 'other',
    
    -- Split configuration
    split_type split_type NOT NULL DEFAULT 'equal',
    
    -- Receipt
    receipt_url TEXT,
    
    -- Timestamps
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_expenses_event ON public.expenses(event_id);
CREATE INDEX idx_expenses_paid_by ON public.expenses(paid_by_participant_id);

-- ============================================
-- EXPENSE SHARES TABLE
-- ============================================

CREATE TABLE public.expense_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    
    -- Share amount (calculated or custom)
    amount DECIMAL(10,2) NOT NULL,
    
    -- Payment status
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- One share per participant per expense
    UNIQUE(expense_id, participant_id)
);

-- Enable RLS
ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_expense_shares_expense ON public.expense_shares(expense_id);
CREATE INDEX idx_expense_shares_participant ON public.expense_shares(participant_id);

-- ============================================
-- MESSAGE TEMPLATES TABLE
-- ============================================

CREATE TABLE public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    
    -- Template identification
    template_key TEXT NOT NULL, -- e.g., 'kickoff', 'budget_poll', 'reminder'
    
    -- Content
    title TEXT NOT NULL,
    content_template TEXT NOT NULL, -- With {{placeholders}}
    emoji_prefix TEXT,
    
    -- Channels
    channels TEXT[] DEFAULT ARRAY['whatsapp'],
    
    -- Localization
    locale TEXT DEFAULT 'de',
    
    -- Order for display
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(event_id, template_key, locale)
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_message_templates_event ON public.message_templates(event_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Helper function: Check if user is participant/organizer of event
CREATE OR REPLACE FUNCTION public.is_event_participant(_user_id UUID, _event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.participants
    WHERE event_id = _event_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_event_organizer(_user_id UUID, _event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.participants
    WHERE event_id = _event_id 
      AND user_id = _user_id 
      AND role = 'organizer'
  )
$$;

-- EVENTS Policies
CREATE POLICY "Public events are viewable by anyone"
ON public.events FOR SELECT
USING (is_public = true);

CREATE POLICY "Participants can view their events"
ON public.events FOR SELECT
USING (public.is_event_participant(auth.uid(), id));

CREATE POLICY "Creators can manage their events"
ON public.events FOR ALL
USING (created_by = auth.uid());

CREATE POLICY "Organizers can update events"
ON public.events FOR UPDATE
USING (public.is_event_organizer(auth.uid(), id));

-- Allow anonymous event creation (will link to user on signup)
CREATE POLICY "Anyone can create events"
ON public.events FOR INSERT
WITH CHECK (true);

-- PARTICIPANTS Policies
CREATE POLICY "Event participants can view other participants"
ON public.participants FOR SELECT
USING (public.is_event_participant(auth.uid(), event_id));

CREATE POLICY "Organizers can manage participants"
ON public.participants FOR ALL
USING (public.is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Users can join events"
ON public.participants FOR INSERT
WITH CHECK (true);

-- EXPENSES Policies
CREATE POLICY "Participants can view expenses"
ON public.expenses FOR SELECT
USING (public.is_event_participant(auth.uid(), event_id));

CREATE POLICY "Participants can add expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.is_event_participant(auth.uid(), event_id));

CREATE POLICY "Expense payer can update their expense"
ON public.expenses FOR UPDATE
USING (
  paid_by_participant_id IN (
    SELECT id FROM public.participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can manage expenses"
ON public.expenses FOR ALL
USING (public.is_event_organizer(auth.uid(), event_id));

-- EXPENSE_SHARES Policies
CREATE POLICY "Participants can view shares"
ON public.expense_shares FOR SELECT
USING (
  expense_id IN (
    SELECT id FROM public.expenses WHERE public.is_event_participant(auth.uid(), event_id)
  )
);

CREATE POLICY "Organizers can manage shares"
ON public.expense_shares FOR ALL
USING (
  expense_id IN (
    SELECT id FROM public.expenses WHERE public.is_event_organizer(auth.uid(), event_id)
  )
);

-- MESSAGE_TEMPLATES Policies
CREATE POLICY "Organizers can manage templates"
ON public.message_templates FOR ALL
USING (public.is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Participants can view templates"
ON public.message_templates FOR SELECT
USING (public.is_event_participant(auth.uid(), event_id));

-- RESPONSES Policies (update existing)
CREATE POLICY "Event responses viewable by participants"
ON public.responses FOR SELECT
USING (public.is_event_participant(auth.uid(), event_id));

CREATE POLICY "Anyone can submit responses"
ON public.responses FOR INSERT
WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
BEFORE UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();