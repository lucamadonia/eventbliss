-- JGA Dominik Database Schema

-- Responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  participant TEXT UNIQUE NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('yes', 'maybe', 'no')),
  duration_pref TEXT NOT NULL CHECK (duration_pref IN ('day', 'weekend', 'either')),
  date_blocks TEXT[] NOT NULL,
  partial_days TEXT,
  budget TEXT NOT NULL,
  destination TEXT NOT NULL CHECK (destination IN ('de_city', 'barcelona', 'lisbon', 'either')),
  de_city TEXT,
  travel_pref TEXT NOT NULL CHECK (travel_pref IN ('daytrip', 'one_night', 'two_nights', 'either')),
  preferences TEXT[] NOT NULL,
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('chill', 'normal', 'sporty')),
  alcohol TEXT CHECK (alcohol IN ('yes', 'no', 'either')),
  restrictions TEXT,
  suggestions TEXT,
  meta JSONB DEFAULT '{}'::jsonb
);

-- Settings table
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
  ('deadline', '{"iso": null}'::jsonb),
  ('locked_block', '{"block": null, "label": null}'::jsonb),
  ('form_locked', '{"enabled": false}'::jsonb);

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- No public access policies - all access via service role in edge functions

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- STAG Multi-Event Platform Database Schema
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
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();-- Fix security warnings: set search_path on update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add missing policy for settings table
CREATE POLICY "Settings are viewable by everyone"
ON public.settings FOR SELECT
USING (true);-- Add dashboard permission columns to participants table
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS can_access_dashboard boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dashboard_permissions jsonb DEFAULT '{"can_view_responses": false, "can_add_expenses": true, "can_view_all_expenses": false, "can_edit_settings": false}'::jsonb,
ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS invite_claimed_at timestamptz;

-- Create index on invite_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_invite_token ON public.participants(invite_token);

-- Update RLS policies to allow users to view their own participant record
CREATE POLICY "Users can view their own participant record"
ON public.participants
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to update their own participant record (for claiming)
CREATE POLICY "Users can update their own participant"
ON public.participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());-- Create schedule_activities table for visual planner
CREATE TABLE public.schedule_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  
  -- Schedule
  day_date date NOT NULL,
  start_time time,
  end_time time,
  
  -- Location details
  location text,
  location_url text,
  
  -- Contact person
  contact_name text,
  contact_phone text,
  contact_email text,
  
  -- Costs
  estimated_cost numeric(10,2),
  currency text DEFAULT 'EUR',
  cost_per_person boolean DEFAULT true,
  
  -- Requirements and notes
  requirements text[],
  notes text,
  
  -- Responsible participant
  responsible_participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  
  -- Sorting
  sort_order integer DEFAULT 0,
  
  -- Meta
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create activity_comments table
CREATE TABLE public.activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_activities
CREATE POLICY "Participants can view activities"
  ON public.schedule_activities
  FOR SELECT
  USING (is_event_participant(auth.uid(), event_id));

CREATE POLICY "Organizers can manage activities"
  ON public.schedule_activities
  FOR ALL
  USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Participants can add activities"
  ON public.schedule_activities
  FOR INSERT
  WITH CHECK (is_event_participant(auth.uid(), event_id));

-- RLS Policies for activity_comments
CREATE POLICY "Participants can view comments"
  ON public.activity_comments
  FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM public.schedule_activities
      WHERE is_event_participant(auth.uid(), event_id)
    )
  );

CREATE POLICY "Participants can add comments"
  ON public.activity_comments
  FOR INSERT
  WITH CHECK (
    activity_id IN (
      SELECT id FROM public.schedule_activities
      WHERE is_event_participant(auth.uid(), event_id)
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.activity_comments
  FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM public.participants WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger for schedule_activities
CREATE TRIGGER update_schedule_activities_updated_at
  BEFORE UPDATE ON public.schedule_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_schedule_activities_event_id ON public.schedule_activities(event_id);
CREATE INDEX idx_schedule_activities_day_date ON public.schedule_activities(day_date);
CREATE INDEX idx_activity_comments_activity_id ON public.activity_comments(activity_id);-- Add category column to schedule_activities table
ALTER TABLE public.schedule_activities 
ADD COLUMN category text DEFAULT 'activity';

-- Add a check constraint for valid categories
ALTER TABLE public.schedule_activities
ADD CONSTRAINT valid_category CHECK (category IN ('activity', 'food', 'transport', 'accommodation', 'party', 'sightseeing', 'relaxation', 'other'));-- Create newsletter_subscribers table for email collection
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locale TEXT DEFAULT 'en',
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'landing_page',
  ip_address TEXT,
  user_agent TEXT,
  gdpr_consent BOOLEAN NOT NULL DEFAULT true,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Policy: Only admins can view subscribers
CREATE POLICY "Admins can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_locale ON public.newsletter_subscribers(locale);-- Add soft-delete columns to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;

-- Add index for efficient querying of non-deleted expenses
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at) WHERE deleted_at IS NULL;

-- Allow organizers to see deleted expenses for audit trail
COMMENT ON COLUMN public.expenses.deleted_at IS 'Soft-delete timestamp - NULL means not deleted';
COMMENT ON COLUMN public.expenses.deleted_by IS 'User ID who deleted the expense';
COMMENT ON COLUMN public.expenses.deletion_reason IS 'Optional reason for deletion';-- Create subscriptions table for premium management
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription (for free tier initialization)
CREATE POLICY "Users can create own subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create security definer function to check premium status
CREATE OR REPLACE FUNCTION public.is_premium(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND plan = 'premium'
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create vouchers table
CREATE TABLE public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_trial', 'lifetime')),
  discount_value numeric,
  max_uses integer,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vouchers" ON public.vouchers
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 3. Create voucher_redemptions table
CREATE TABLE public.voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid REFERENCES public.vouchers(id) NOT NULL,
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  redeemed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view redemptions" ON public.voucher_redemptions
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can redeem vouchers" ON public.voucher_redemptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own redemptions" ON public.voucher_redemptions
FOR SELECT USING (auth.uid() = user_id);

-- 4. Add admin RLS policies for subscriptions
CREATE POLICY "Admins can update subscriptions" ON public.subscriptions
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));-- Fix: RLS Policy für Vouchers korrigieren (WITH CHECK fehlte für INSERT)
DROP POLICY IF EXISTS "Admins can manage vouchers" ON public.vouchers;

CREATE POLICY "Admins can manage vouchers"
ON public.vouchers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Profiles-Tabelle erstellen für Benutzer-Verwaltung
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  must_change_password boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies für Profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger für automatische Profile-Erstellung bei neuen Benutzern
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, must_change_password)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger für updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Add stripe_coupon_id column to vouchers table
ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS stripe_coupon_id text;-- Create enums for affiliate system
CREATE TYPE public.affiliate_status AS ENUM ('pending', 'active', 'suspended', 'terminated');
CREATE TYPE public.affiliate_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE public.commission_type AS ENUM ('percentage', 'fixed');
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.payout_method AS ENUM ('bank_transfer', 'paypal', 'stripe');

-- Affiliates table (Partner-Stammdaten)
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  tax_id TEXT,
  payout_method public.payout_method DEFAULT 'bank_transfer',
  payout_details JSONB DEFAULT '{}'::jsonb,
  status public.affiliate_status DEFAULT 'pending',
  commission_type public.commission_type DEFAULT 'percentage',
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  tier public.affiliate_tier DEFAULT 'bronze',
  notes TEXT,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  pending_balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate vouchers (Verknüpfung Partner zu Gutscheinen)
CREATE TABLE public.affiliate_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  custom_commission_type public.commission_type,
  custom_commission_rate NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(affiliate_id, voucher_id)
);

-- Affiliate commissions (Provisionsabrechnungen)
CREATE TABLE public.affiliate_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
  redemption_id UUID REFERENCES public.voucher_redemptions(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  customer_email TEXT,
  order_amount NUMERIC(12,2) NOT NULL,
  commission_type public.commission_type NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status public.commission_status DEFAULT 'pending',
  payout_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate payouts (Auszahlungen)
CREATE TABLE public.affiliate_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status public.payout_status DEFAULT 'pending',
  payout_method public.payout_method NOT NULL,
  payout_reference TEXT,
  period_start DATE,
  period_end DATE,
  commission_count INTEGER DEFAULT 0,
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for payout_id in commissions (after payouts table exists)
ALTER TABLE public.affiliate_commissions 
  ADD CONSTRAINT affiliate_commissions_payout_id_fkey 
  FOREIGN KEY (payout_id) REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is an affiliate
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- Get affiliate ID for a user
CREATE OR REPLACE FUNCTION public.get_affiliate_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for affiliates
CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own record"
  ON public.affiliates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own record"
  ON public.affiliates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for affiliate_vouchers
CREATE POLICY "Admins can manage affiliate vouchers"
  ON public.affiliate_vouchers FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own vouchers"
  ON public.affiliate_vouchers FOR SELECT
  USING (affiliate_id = get_affiliate_id(auth.uid()));

-- RLS Policies for affiliate_commissions
CREATE POLICY "Admins can manage all commissions"
  ON public.affiliate_commissions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (affiliate_id = get_affiliate_id(auth.uid()));

-- RLS Policies for affiliate_payouts
CREATE POLICY "Admins can manage all payouts"
  ON public.affiliate_payouts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own payouts"
  ON public.affiliate_payouts FOR SELECT
  USING (affiliate_id = get_affiliate_id(auth.uid()));

CREATE POLICY "Affiliates can request payouts"
  ON public.affiliate_payouts FOR INSERT
  WITH CHECK (affiliate_id = get_affiliate_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at
  BEFORE UPDATE ON public.affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_affiliate_vouchers_affiliate_id ON public.affiliate_vouchers(affiliate_id);
CREATE INDEX idx_affiliate_vouchers_voucher_id ON public.affiliate_vouchers(voucher_id);
CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_payout_id ON public.affiliate_commissions(payout_id);
CREATE INDEX idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_email ON public.affiliates(email);

-- Neue Tabelle für Agentur-Interaktionen (Analytics)
CREATE TABLE public.agency_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  agency_id text NOT NULL,
  agency_name text NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('phone', 'email', 'website')),
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.agency_interactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Participants can log interactions"
ON public.agency_interactions FOR INSERT
WITH CHECK (is_event_participant(auth.uid(), event_id));

CREATE POLICY "Organizers can view interactions"
ON public.agency_interactions FOR SELECT
USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Admins can view all interactions"
ON public.agency_interactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policy für Aktivitäten-Löschen durch Teilnehmer
CREATE POLICY "Participants can delete activities they created"
ON public.schedule_activities FOR DELETE
USING (
  responsible_participant_id IN (
    SELECT id FROM public.participants WHERE user_id = auth.uid()
  )
  AND is_event_participant(auth.uid(), event_id)
);-- Agency Affiliates table for tracking agency partnerships
CREATE TABLE public.agency_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id text NOT NULL,
  agency_name text NOT NULL,
  agency_city text NOT NULL,
  agency_country text NOT NULL,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  commission_rate numeric DEFAULT 10.00,
  commission_type public.commission_type DEFAULT 'percentage',
  is_verified boolean DEFAULT false,
  contact_email text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  total_referrals integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_commission numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_affiliates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_affiliates
CREATE POLICY "Admins can manage agency affiliates"
ON public.agency_affiliates FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agencies can view own record"
ON public.agency_affiliates FOR SELECT
USING (affiliate_id = public.get_affiliate_id(auth.uid()));

-- Add conversion tracking columns to agency_interactions
ALTER TABLE public.agency_interactions
ADD COLUMN ref_code text,
ADD COLUMN converted boolean DEFAULT false,
ADD COLUMN converted_at timestamptz,
ADD COLUMN booking_value numeric;

-- Create index for ref_code lookups
CREATE INDEX idx_agency_interactions_ref_code ON public.agency_interactions(ref_code);

-- Update trigger for agency_affiliates
CREATE TRIGGER update_agency_affiliates_updated_at
BEFORE UPDATE ON public.agency_affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add multilingual description columns and contact fields to agency_affiliates
ALTER TABLE public.agency_affiliates 
ADD COLUMN IF NOT EXISTS description_de TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT,
ADD COLUMN IF NOT EXISTS description_it TEXT,
ADD COLUMN IF NOT EXISTS description_nl TEXT,
ADD COLUMN IF NOT EXISTS description_pl TEXT,
ADD COLUMN IF NOT EXISTS description_pt TEXT,
ADD COLUMN IF NOT EXISTS description_tr TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;-- Create ai_usage table to track AI credits consumption
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
  FOR INSERT WITH CHECK (true);-- Create table for manual credit adjustments by admins
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
  FOR SELECT USING (auth.uid() = user_id);-- Plan configurations table for dynamic credit limits and features
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
EXECUTE FUNCTION public.update_updated_at_column();-- Remove outdated CHECK constraints that block dynamic values
-- These constraints only allowed static values but event settings now define options dynamically

-- Drop destination check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'responses' AND constraint_name = 'responses_destination_check'
  ) THEN
    ALTER TABLE responses DROP CONSTRAINT responses_destination_check;
  END IF;
END $$;

-- Drop budget check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'responses' AND constraint_name = 'responses_budget_check'
  ) THEN
    ALTER TABLE responses DROP CONSTRAINT responses_budget_check;
  END IF;
END $$;

-- Drop duration_pref check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'responses' AND constraint_name = 'responses_duration_pref_check'
  ) THEN
    ALTER TABLE responses DROP CONSTRAINT responses_duration_pref_check;
  END IF;
END $$;

-- Also check for any other naming patterns
DO $$ 
BEGIN
  -- Try alternative constraint names
  BEGIN
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_destination_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_budget_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_duration_pref_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';-- Create user_activity_logs table for comprehensive activity tracking
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}',
  performed_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add index for faster queries
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.user_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can delete activity logs
CREATE POLICY "Admins can delete activity logs"
  ON public.user_activity_logs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));-- Tabelle für User-Feedback erstellen
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  page_url text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS aktivieren
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Jeder kann Feedback einsenden (auch nicht eingeloggte Nutzer)
CREATE POLICY "Anyone can submit feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (true);

-- Nur Admins können Feedback lesen
CREATE POLICY "Admins can view feedback"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Nur Admins können Feedback aktualisieren
CREATE POLICY "Admins can update feedback"
  ON public.user_feedback FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Atomic voucher redemption function
CREATE OR REPLACE FUNCTION public.increment_voucher_used_count(
  p_voucher_id UUID,
  p_max_uses INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vouchers
  SET used_count = used_count + 1
  WHERE id = p_voucher_id
    AND (used_count < p_max_uses);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher has reached maximum redemptions';
  END IF;
END;
$$;

-- Processed webhook events table for idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id
  ON public.processed_webhook_events (stripe_event_id);

-- Unique constraint on affiliate_commissions to prevent duplicate commissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_commissions_stripe_session_id_key'
  ) THEN
    ALTER TABLE public.affiliate_commissions
      ADD CONSTRAINT affiliate_commissions_stripe_session_id_key UNIQUE (stripe_session_id);
  END IF;
END;
$$;

-- Atomic affiliate balance increment function
CREATE OR REPLACE FUNCTION public.increment_affiliate_balance(
  p_affiliate_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.affiliates
  SET
    pending_balance = pending_balance + p_amount,
    total_earnings = total_earnings + p_amount
  WHERE id = p_affiliate_id;
END;
$$;

-- Enable RLS on new table
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access processed events
CREATE POLICY "Service role only" ON public.processed_webhook_events
  FOR ALL USING (auth.role() = 'service_role');
