-- Create newsletter_subscribers table for email collection
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
CREATE INDEX idx_newsletter_subscribers_locale ON public.newsletter_subscribers(locale);