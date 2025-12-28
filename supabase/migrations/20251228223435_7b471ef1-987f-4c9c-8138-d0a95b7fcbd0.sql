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
  EXECUTE FUNCTION public.update_updated_at_column();