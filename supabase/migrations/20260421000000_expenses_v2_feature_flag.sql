-- Seed the `expenses_v2` feature flag so admins can flip it in the
-- FeatureFlagsTab without having to INSERT by hand. Starts at
-- `is_enabled = false` + 0% rollout so production is unaffected until
-- an admin actively turns it on.
--
-- Idempotent: safe to re-run.

insert into public.feature_flags (key, name, description, is_enabled, rollout_percentage)
values (
  'expenses_v2',
  'Expenses v2',
  'Neue Ausgaben-UX mit Receipt-OCR, Voice-Input, Smart-Split-Gedächtnis, Schulden-Minimierung und erweitertem Aktivitäts-Log. Auf false lassen bis Canary-Tester bestätigen.',
  false,
  0
)
on conflict (key) do nothing;
