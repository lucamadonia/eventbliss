-- =====================================================================
-- Pre-launch RLS hardening (2026-11-08)
--
-- Closes the write paths that survived 20260708000000_security_hardening_pentest:
--   1. responses           — drop anonymous INSERT; writes only via submit-response (service role)
--   2. agency_notifications— drop "System can insert" (service role bypasses RLS anyway),
--                            add the missing DELETE-own policy the UI already calls
--   3. achievements        — RLS was never enabled; read-only catalog now
--   4. newsletter_subscribers / user_feedback — anonymous INSERT stays (landing page
--                            and game report modal write directly), but WITH CHECK (true)
--                            is replaced by checks that stop self-confirming / spoofing
--   5. agency_members      — "Claim invite by token" let ANY signed-in user update ANY
--                            pending invite of ANY agency. Replaced with an email-bound
--                            claim + column guard. Also removes the self-referencing
--                            sub-select in "Admins can manage members" (RLS recursion).
--
-- Idempotent: every policy is dropped before it is (re)created.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. responses
--    Client never inserts (grep src: only .select() in NativeResponsesTab).
--    submit-response uses SUPABASE_SERVICE_ROLE_KEY → unaffected by RLS.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit responses" ON public.responses;


-- ---------------------------------------------------------------------
-- 2. agency_notifications
--    No client or DB-function inserts exist; only edge functions (service role).
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON public.agency_notifications;

-- useAgencyNotifications.deleteNotification() calls .delete() — without a
-- DELETE policy that silently deleted nothing.
DROP POLICY IF EXISTS "Users delete own notifications" ON public.agency_notifications;
CREATE POLICY "Users delete own notifications"
ON public.agency_notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 3. achievements — static catalog, readable by everyone, no client writes.
-- ---------------------------------------------------------------------
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Achievements catalog is public" ON public.achievements;
CREATE POLICY "Achievements catalog is public"
ON public.achievements FOR SELECT
TO anon, authenticated
USING (true);


-- ---------------------------------------------------------------------
-- 4a. newsletter_subscribers
--     NewsletterForm inserts as anon with confirmed_at NULL and a 64-hex
--     confirmation_token. Block self-confirmed / pre-unsubscribed rows and
--     rows without GDPR consent.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (
  confirmed_at IS NULL
  AND unsubscribed_at IS NULL
  AND gdpr_consent = true
  AND confirmation_token IS NOT NULL
  AND char_length(confirmation_token) >= 32
  AND char_length(email) BETWEEN 3 AND 320
);


-- ---------------------------------------------------------------------
-- 4b. user_feedback
--     Landing.tsx + GameReportModal insert (anon or signed in) without
--     user_id/status. Stop attributing feedback to other users and
--     pre-setting the admin-only status.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;
CREATE POLICY "Anyone can submit feedback"
ON public.user_feedback FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND COALESCE(status, 'new') = 'new'
  AND char_length(message) <= 10000
);


-- ---------------------------------------------------------------------
-- 5. agency_members
-- ---------------------------------------------------------------------

-- 5a. SECURITY DEFINER helpers (bypass RLS → no policy recursion).
CREATE OR REPLACE FUNCTION public.is_agency_admin(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = _agency_id AND a.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.agency_members m
    WHERE m.agency_id = _agency_id
      AND m.user_id = _user_id
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
$$;

-- Verified e-mail of the caller (NULL when unconfirmed / not signed in).
CREATE OR REPLACE FUNCTION public.current_user_verified_email()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT lower(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.is_agency_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_agency_admin(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.current_user_verified_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_verified_email() TO authenticated, service_role;

-- 5b. Admin policy without the self-referencing EXISTS on agency_members.
--     Same semantics: agency owner, or active owner/admin member.
DROP POLICY IF EXISTS "Admins can manage members" ON public.agency_members;
CREATE POLICY "Admins can manage members"
ON public.agency_members FOR ALL
TO authenticated
USING (public.is_agency_admin(auth.uid(), agency_id))
WITH CHECK (public.is_agency_admin(auth.uid(), agency_id));

-- 5c. Invite claim: only the invited (verified) e-mail may see / claim its row,
--     and only by binding it to itself and activating it.
--     Matches useAgency.fetchAgency(): select by email+status='invited',
--     then update { user_id, status: 'active', joined_at }.
DROP POLICY IF EXISTS "Claim invite by token" ON public.agency_members;

DROP POLICY IF EXISTS "Invitee can view own invite" ON public.agency_members;
CREATE POLICY "Invitee can view own invite"
ON public.agency_members FOR SELECT
TO authenticated
USING (
  status = 'invited'
  AND lower(email) = public.current_user_verified_email()
);

DROP POLICY IF EXISTS "Invitee can claim own invite" ON public.agency_members;
CREATE POLICY "Invitee can claim own invite"
ON public.agency_members FOR UPDATE
TO authenticated
USING (
  status = 'invited'
  AND lower(email) = public.current_user_verified_email()
)
WITH CHECK (
  user_id = auth.uid()
  AND status = 'active'
  AND lower(email) = public.current_user_verified_email()
);

-- 5d. Column guard: RLS cannot restrict columns, so a non-admin claimer
--     could otherwise set role = 'owner' or move the row to another agency.
CREATE OR REPLACE FUNCTION public.guard_agency_member_claim()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- service role / cron / SQL editor
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_agency_admin(auth.uid(), OLD.agency_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.agency_id    IS DISTINCT FROM OLD.agency_id
  OR NEW.role         IS DISTINCT FROM OLD.role
  OR NEW.email        IS DISTINCT FROM OLD.email
  OR NEW.invite_token IS DISTINCT FROM OLD.invite_token
  OR NEW.invited_by   IS DISTINCT FROM OLD.invited_by
  OR NEW.invited_at   IS DISTINCT FROM OLD.invited_at
  OR NEW.created_at   IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'agency_members: only user_id, status and joined_at may change when claiming an invite'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS guard_agency_member_claim ON public.agency_members;
CREATE TRIGGER guard_agency_member_claim
BEFORE UPDATE ON public.agency_members
FOR EACH ROW EXECUTE FUNCTION public.guard_agency_member_claim();


-- ---------------------------------------------------------------------
-- 6. agencies — admin moderation + privileged-column guard
--    AgencyRiskMonitor "Listing deaktivieren" sets is_active=false; there
--    was no admin UPDATE policy. Conversely "Agency owner can manage" (FOR
--    ALL) let owners flip is_active back on or raise their own plan limits.
--    Client code (AgencySettings / useAgency.createAgency) never writes
--    these columns; agency-subscribe & webhooks use the service role.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update agencies" ON public.agencies;
CREATE POLICY "Admins can update agencies"
ON public.agencies FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SECURITY INVOKER on purpose: current_user must be the caller's role.
CREATE OR REPLACE FUNCTION public.guard_agency_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  -- Only police direct client statements (PostgREST roles). Service role,
  -- SECURITY DEFINER functions and the SQL editor run as other roles.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_active           := true;
    NEW.subscription_plan   := 'starter';
    NEW.max_members         := 5;
    NEW.max_events          := 10;
    NEW.storage_limit_gb    := 5;
    NEW.marketplace_enabled := false;
    NEW.marketplace_tier    := 'starter';
  ELSE
    NEW.owner_id            := OLD.owner_id;
    NEW.is_active           := OLD.is_active;
    NEW.subscription_plan   := OLD.subscription_plan;
    NEW.max_members         := OLD.max_members;
    NEW.max_events          := OLD.max_events;
    NEW.storage_limit_gb    := OLD.storage_limit_gb;
    NEW.marketplace_enabled := OLD.marketplace_enabled;
    NEW.marketplace_tier    := OLD.marketplace_tier;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS guard_agency_privileged_columns ON public.agencies;
CREATE TRIGGER guard_agency_privileged_columns
BEFORE INSERT OR UPDATE ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.guard_agency_privileged_columns();


-- ---------------------------------------------------------------------
-- 7. marketplace_services — agencies must not self-approve / un-suspend
--    "Agency members manage own services" is FOR ALL without a status
--    check. Agency UI only inserts 'draft' and submits 'pending_review'
--    (useAgencyServices). Approval/suspension is admin-only
--    (MarketplaceListingsTab / AgencyRiskMonitor → has_role admin).
--    Rating/booking counters are maintained by SECURITY DEFINER triggers
--    (update_service_rating) and service-role functions → not affected.
-- ---------------------------------------------------------------------
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
CREATE OR REPLACE FUNCTION public.guard_marketplace_service_moderation()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('draft', 'pending_review') THEN
      RAISE EXCEPTION 'marketplace_services: new listings must start as draft or pending_review'
        USING ERRCODE = '42501';
    END IF;
    NEW.is_featured    := false;
    NEW.featured_until := NULL;
    NEW.avg_rating     := 0;
    NEW.review_count   := 0;
    NEW.booking_count  := 0;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'suspended'
       OR NEW.status NOT IN ('draft', 'pending_review', 'archived') THEN
      RAISE EXCEPTION 'marketplace_services: status % -> % requires admin review', OLD.status, NEW.status
        USING ERRCODE = '42501';
    END IF;
  END IF;

  NEW.is_featured    := OLD.is_featured;
  NEW.featured_until := OLD.featured_until;
  NEW.avg_rating     := OLD.avg_rating;
  NEW.review_count   := OLD.review_count;
  NEW.booking_count  := OLD.booking_count;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS guard_marketplace_service_moderation ON public.marketplace_services;
CREATE TRIGGER guard_marketplace_service_moderation
BEFORE INSERT OR UPDATE ON public.marketplace_services
FOR EACH ROW EXECUTE FUNCTION public.guard_marketplace_service_moderation();


-- ---------------------------------------------------------------------
-- 8. voucher_redemptions — one redemption per (voucher, user)
--    redeem-voucher checks "already redeemed" with a SELECT before the
--    INSERT, which races under parallel requests. Enforce it in the DB.
--    Dedupe first (keep earliest row), re-pointing affiliate_commissions
--    so no commission loses its redemption link via ON DELETE SET NULL.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'voucher_redemptions_voucher_user_key'
      AND conrelid = 'public.voucher_redemptions'::regclass
  ) THEN
    CREATE TEMP TABLE _vr_dupes ON COMMIT DROP AS
    SELECT id, keep_id
    FROM (
      SELECT id,
             first_value(id) OVER w AS keep_id,
             row_number()    OVER w AS rn
      FROM public.voucher_redemptions
      WINDOW w AS (PARTITION BY voucher_id, user_id
                   ORDER BY redeemed_at ASC NULLS LAST, id ASC)
    ) ranked
    WHERE rn > 1;

    UPDATE public.affiliate_commissions ac
    SET redemption_id = d.keep_id
    FROM _vr_dupes d
    WHERE ac.redemption_id = d.id;

    DELETE FROM public.voucher_redemptions vr
    USING _vr_dupes d
    WHERE vr.id = d.id;

    ALTER TABLE public.voucher_redemptions
      ADD CONSTRAINT voucher_redemptions_voucher_user_key UNIQUE (voucher_id, user_id);
  END IF;
END
$$;

-- Redemptions are written only by redeem-voucher (service role, index.ts:42-46).
-- The client INSERT policy let users fabricate redemption rows directly.
DROP POLICY IF EXISTS "Users can redeem vouchers" ON public.voucher_redemptions;
