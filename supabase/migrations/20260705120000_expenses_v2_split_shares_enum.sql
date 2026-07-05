-- Add the 'shares' value to the split_type enum (weighted shares / Anteile mode).
--
-- MUST live in its own migration with nothing that *uses* the new value:
-- Postgres allows ALTER TYPE ... ADD VALUE inside a transaction (PG12+), but the
-- freshly-added value cannot be referenced by other statements in the same
-- transaction. Keeping this isolated guarantees that.
--
-- Idempotent: IF NOT EXISTS makes re-runs safe.

ALTER TYPE public.split_type ADD VALUE IF NOT EXISTS 'shares';
