-- ============================================
-- Public read access for active agencies
-- ============================================
-- Required for /marketplace/agency/:slug and /embed/agency/:slug to work
-- for anonymous users (customers browsing, websites embedding).
--
-- Columns of public.agencies are already marketing-facing:
-- name, slug, logo_url, website, email, phone, city, country,
-- primary_color, accent_color, marketplace_tier, is_active, created_at.
-- Sensitive business fields (owner_id, storage_limit_gb) also visible but
-- non-actionable without write access.

DROP POLICY IF EXISTS "Public can view active agencies" ON public.agencies;
CREATE POLICY "Public can view active agencies"
ON public.agencies FOR SELECT
USING (is_active = true);
