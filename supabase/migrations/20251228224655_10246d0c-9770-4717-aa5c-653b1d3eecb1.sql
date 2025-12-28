-- Fix security warnings: set search_path on update_updated_at_column function
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
USING (true);