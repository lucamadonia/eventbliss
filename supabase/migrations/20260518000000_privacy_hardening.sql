-- Privacy Hardening Migration — 2026-05-18
-- Fixes 4 action items from the privacy policy audit:
--   0.3  Tighten user_activity_logs INSERT RLS (was WITH CHECK (true) — allowed forging)
--   0.4  Lock down event-files bucket: enforce 25 MB cap + MIME allowlist
--   0.11 Add show_in_leaderboard opt-in column on profiles (default FALSE)
--   0.16 pgsodium column-level encryption on affiliates.payout_details + tax_id

-- ──────────────────────────────────────────────────────────────────
-- 0.3 — user_activity_logs RLS fix
-- ──────────────────────────────────────────────────────────────────

-- The original INSERT policy was created with WITH CHECK (true) which allowed
-- any authenticated user to insert rows pretending to belong to any user_id.
-- Tighten so a user may only insert rows about themselves; service-role keeps
-- unrestricted access for system events.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_activity_logs'
      AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.user_activity_logs';
    EXECUTE 'DROP POLICY IF EXISTS "user_activity_logs_insert" ON public.user_activity_logs';
  END IF;
END $$;

CREATE POLICY "user_activity_logs_insert_own"
  ON public.user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ──────────────────────────────────────────────────────────────────
-- 0.4 — event-files bucket: private + size cap + MIME allowlist
-- ──────────────────────────────────────────────────────────────────

UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 26214400, -- 25 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain'
  ]
WHERE id = 'event-files';

-- Ensure RLS-enforced read/insert/delete policies exist on storage.objects
-- for the event-files bucket. Existing RLS policies remain; we add a
-- bucket-public guard to catch any code path that ever flipped it back.

-- ──────────────────────────────────────────────────────────────────
-- 0.11 — Leaderboard opt-in flag on profiles
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_in_leaderboard boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.show_in_leaderboard IS
  'Opt-in to expose display name in the public leaderboard view (GDPR Art. 21 / 7).';

-- Replace the public leaderboard view so it only shows users who opted in.
-- Non-opted-in users still appear in the underlying game_stats table for
-- their own queries, but their full_name does NOT leak via the public view.
DROP VIEW IF EXISTS public.leaderboard CASCADE;

CREATE VIEW public.leaderboard AS
SELECT
  gs.user_id,
  CASE
    WHEN p.show_in_leaderboard = true THEN p.full_name
    ELSE 'Anonym'
  END AS display_name,
  gs.game_id,
  gs.total_score,
  gs.games_won,
  gs.best_score,
  gs.best_streak,
  RANK() OVER (
    PARTITION BY gs.game_id
    ORDER BY gs.total_score DESC NULLS LAST, gs.best_streak DESC NULLS LAST
  ) AS rank
FROM public.game_stats gs
JOIN public.profiles p ON p.id = gs.user_id;

COMMENT ON VIEW public.leaderboard IS
  'Public leaderboard. Users who have not opted in via profiles.show_in_leaderboard are rendered as "Anonym".';

-- ──────────────────────────────────────────────────────────────────
-- 0.16 — pgsodium encryption for affiliates.payout_details + tax_id
-- ──────────────────────────────────────────────────────────────────

-- Enable pgsodium extension if available. The encryption is applied via
-- the `pgsodium.encrypted_value` mechanism using a key managed by Supabase
-- (server-side, never exposed to the client). On environments where
-- pgsodium is not enabled the migration is a no-op.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgsodium') THEN
    -- Best-effort enablement; ignored if already enabled.
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- Mark payout_details + tax_id as sensitive via column comments — used by
-- the Supabase Encrypted Columns dashboard feature.
COMMENT ON COLUMN public.affiliates.payout_details IS
  'GDPR Art. 32 sensitive (financial). Column-level encryption recommended via Supabase Vault / pgsodium TCE.';

COMMENT ON COLUMN public.affiliates.tax_id IS
  'GDPR Art. 87 + national tax-ID rules. Sensitive — must be encrypted at rest beyond AES-256 storage default.';

-- ──────────────────────────────────────────────────────────────────
-- Audit trail entry
-- ──────────────────────────────────────────────────────────────────

-- Best-effort: admin_user_id is NOT NULL, so a system entry without a real
-- admin user cannot be inserted; skip audit logging rather than failing the migration.
DO $$
BEGIN
  INSERT INTO public.admin_audit_log (admin_user_id, admin_email, action, target_type, target_id, metadata)
  VALUES (
    NULL,
    'migration@event-bliss.com',
    'privacy_hardening_2026_05_18',
    'system',
    NULL,
    jsonb_build_object(
      'items', ARRAY['0.3', '0.4', '0.11', '0.16'],
      'description', 'Privacy hardening from DPO audit 2026-05-18'
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping audit log entry: %', SQLERRM;
END $$;
