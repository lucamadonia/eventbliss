-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';