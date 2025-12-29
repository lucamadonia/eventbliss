-- Create enums for affiliate system
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