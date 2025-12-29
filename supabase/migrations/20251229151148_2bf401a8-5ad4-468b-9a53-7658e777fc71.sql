-- Add stripe_coupon_id column to vouchers table
ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS stripe_coupon_id text;