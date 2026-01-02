-- Agency Affiliates table for tracking agency partnerships
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
EXECUTE FUNCTION public.update_updated_at_column();