-- community_users_meta — defensive scaffold for community / agency rules acceptance tracking.
-- 2026-05-18
--
-- This migration was triggered by a downstream `ALTER TABLE community_users_meta ADD COLUMN`
-- attempt that failed because the table did not yet exist in this repo's migration history.
-- We create the table (idempotent) and ensure the rules-acceptance columns are present.
-- GDPR-relevant: stores explicit timestamped consent to community rules.

CREATE TABLE IF NOT EXISTS public.community_users_meta (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rules_accepted_at      TIMESTAMPTZ,
  rules_accepted_version TEXT,
  marketing_opt_in       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent ALTERs (the originally-failing statements)
ALTER TABLE public.community_users_meta
  ADD COLUMN IF NOT EXISTS rules_accepted_at      TIMESTAMPTZ;

ALTER TABLE public.community_users_meta
  ADD COLUMN IF NOT EXISTS rules_accepted_version TEXT;

COMMENT ON TABLE public.community_users_meta IS
  'Per-user metadata for community/agency areas — tracks rules acceptance (GDPR Art. 7 evidence).';
COMMENT ON COLUMN public.community_users_meta.rules_accepted_at IS
  'Timestamp at which the user accepted the community rules (Art. 7 DSGVO consent evidence).';
COMMENT ON COLUMN public.community_users_meta.rules_accepted_version IS
  'Version identifier of the community rules at the time of acceptance (e.g. "2026-05-18-v1").';

-- updated_at trigger (re-use shared helper if exists, otherwise inline)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'set_updated_at'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    DROP TRIGGER IF EXISTS trg_community_users_meta_set_updated_at ON public.community_users_meta;
    CREATE TRIGGER trg_community_users_meta_set_updated_at
      BEFORE UPDATE ON public.community_users_meta
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- RLS — each user reads/writes their own row.
ALTER TABLE public.community_users_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_users_meta_self_select ON public.community_users_meta;
CREATE POLICY community_users_meta_self_select
  ON public.community_users_meta
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS community_users_meta_self_insert ON public.community_users_meta;
CREATE POLICY community_users_meta_self_insert
  ON public.community_users_meta
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS community_users_meta_self_update ON public.community_users_meta;
CREATE POLICY community_users_meta_self_update
  ON public.community_users_meta
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
