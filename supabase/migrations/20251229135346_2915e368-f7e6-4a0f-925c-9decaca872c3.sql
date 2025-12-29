-- 1. Add admin role for luca@madonia-freiburg.de
INSERT INTO user_roles (user_id, role) 
VALUES ('aeec7eb2-cb02-4338-a2c0-82bb946900c6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Create vouchers table
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
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));