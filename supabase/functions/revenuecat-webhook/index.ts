import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  isUniqueViolation,
  pickTransferUsers,
  shouldApplyRevenueCatExpiration,
  shouldOverwriteSubscription,
  type SubscriptionRow,
  timingSafeEqualStr,
} from "../_shared/stripe-compat.ts";

// RevenueCat webhook (Webhook v1 format) for native in-app purchases.
//
// The frontend calls Purchases.logIn(user.id), so `app_user_id` is the
// Supabase auth user UUID. Anonymous RevenueCat ids ($RCAnonymousID:...)
// are acknowledged with 200 and ignored — they cannot be mapped to a user.
//
// Auth: RevenueCat sends the configured Authorization header value verbatim;
// we compare it (constant-time) against the REVENUECAT_WEBHOOK_AUTH secret.
//
// Ownership: public.subscriptions has ONE row per user (UNIQUE(user_id)).
// A RevenueCat event never replaces an active Stripe / manual / lifetime
// entitlement unless it is itself lifetime or runs longer
// (shouldOverwriteSubscription), and downgrades only touch provider='revenuecat'.
//
// Failures: any DB error throws → 500 → RevenueCat retries. The idempotency
// marker is written only after successful processing.

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REVENUECAT-WEBHOOK] ${step}${detailsStr}`);
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUserUuid = (id: string) => UUID_REGEX.test(id);

// Product id convention: eventbliss_premium_monthly / _yearly / _lifetime
function derivePlanType(productId: string | null | undefined): string | null {
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes("lifetime")) return "lifetime";
  if (id.includes("yearly")) return "yearly";
  if (id.includes("monthly")) return "monthly";
  return null;
}

function msToIso(ms: number | null | undefined): string | null {
  return typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
type Db = any;

const ROW_COLUMNS = "user_id, plan, provider, plan_type, product_id, expires_at, started_at, stripe_subscription_id";

async function loadRow(db: Db, userId: string): Promise<(SubscriptionRow & Record<string, unknown>) | null> {
  const { data, error } = await db
    .from("subscriptions")
    .select(ROW_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Loading subscription failed: ${error.message}`);
  return data ?? null;
}

interface RcGrant {
  productId: string | null;
  planType: string | null;
  expiresAt: string | null;
  startedAt: string;
}

/** Writes a RevenueCat entitlement unless a stronger one already owns the row. */
async function applyGrant(db: Db, userId: string, grant: RcGrant): Promise<"written" | "kept_existing"> {
  const existing = await loadRow(db, userId);
  const lifetime = grant.planType === "lifetime";
  if (!shouldOverwriteSubscription(existing, { lifetime, expiresAt: grant.expiresAt }, Date.now())) {
    logStep("Existing entitlement is stronger, not overwriting", {
      userId,
      existingProvider: existing?.provider,
      existingPlanType: existing?.plan_type,
      existingExpiresAt: existing?.expires_at,
      incomingPlanType: grant.planType,
      incomingExpiresAt: grant.expiresAt,
    });
    return "kept_existing";
  }

  // stripe_customer_id is intentionally NOT touched: keeping it lets the web
  // side find the customer again; stripe_subscription_id is cleared so Stripe
  // webhooks for an old web subscription no longer address this row.
  const { error } = await db
    .from("subscriptions")
    .upsert({
      user_id: userId,
      plan: "premium",
      provider: "revenuecat",
      product_id: grant.productId,
      plan_type: grant.planType,
      started_at: grant.startedAt,
      expires_at: lifetime ? null : grant.expiresAt,
      stripe_subscription_id: null,
    }, { onConflict: "user_id" });
  if (error) throw new Error(`Upserting subscription failed: ${error.message}`);
  return "written";
}

async function downgradeRevenueCatRow(db: Db, userId: string): Promise<void> {
  const { error } = await db
    .from("subscriptions")
    .update({ plan: "free", expires_at: null })
    .eq("user_id", userId)
    .eq("provider", "revenuecat");
  if (error) throw new Error(`Downgrading subscription failed: ${error.message}`);
}

async function handleExpiration(
  db: Db,
  userId: string,
  productId: string | undefined,
  expirationAtMs: number | null,
  reason: string,
): Promise<void> {
  const existing = await loadRow(db, userId);
  const expiringProductIsLifetime = derivePlanType(productId) === "lifetime";
  if (!shouldApplyRevenueCatExpiration(existing, { expiringProductIsLifetime, expirationAtMs })) {
    logStep(`${reason}: row not downgraded`, {
      userId,
      provider: existing?.provider,
      planType: existing?.plan_type,
      expiresAt: existing?.expires_at,
    });
    return;
  }
  await downgradeRevenueCatRow(db, userId);
  logStep(`${reason}: downgraded to free`, { userId });
}

/** TRANSFER: move the RevenueCat entitlement from transferred_from → transferred_to. */
async function handleTransfer(db: Db, event: Record<string, unknown>): Promise<void> {
  const { sourceIds, targetId } = pickTransferUsers(
    event.transferred_from,
    event.transferred_to,
    isUserUuid,
  );
  logStep("TRANSFER", { sourceIds, targetId });
  if (!targetId || sourceIds.length === 0) {
    logStep("TRANSFER without mappable source/target user, ignoring");
    return;
  }

  // Pick the strongest active RevenueCat entitlement among the sources.
  const now = Date.now();
  let best: (SubscriptionRow & Record<string, unknown>) | null = null;
  const rcSources: string[] = [];
  for (const id of sourceIds) {
    const row = await loadRow(db, id);
    if (!row || row.provider !== "revenuecat") continue;
    rcSources.push(id);
    if (row.plan !== "premium") continue;
    const active = !row.expires_at || Date.parse(row.expires_at) > now;
    if (!active) continue;
    if (
      !best ||
      !row.expires_at ||
      (best.expires_at && Date.parse(row.expires_at) > Date.parse(best.expires_at))
    ) {
      best = row;
    }
  }

  if (best) {
    const result = await applyGrant(db, targetId, {
      productId: (best.product_id as string | null) ?? null,
      planType: best.plan_type ?? (best.expires_at ? null : "lifetime"),
      expiresAt: best.expires_at ?? null,
      startedAt: (best.started_at as string | null) ?? new Date().toISOString(),
    });
    logStep("TRANSFER target updated", { targetId, result });
  } else {
    logStep("TRANSFER: no active RevenueCat entitlement on source users", { sourceIds });
  }

  // The store purchase now belongs to the target — revoke it on the sources.
  // Only provider='revenuecat' rows; Stripe / manual rows stay untouched.
  for (const id of rcSources) {
    await downgradeRevenueCatRow(db, id);
  }
  logStep("TRANSFER sources downgraded", { rcSources });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: constant-time compare of Authorization header with secret ---
  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expectedAuth) {
    logStep("ERROR", { message: "REVENUECAT_WEBHOOK_AUTH is not set" });
    return jsonResponse({ error: "Server configuration error" }, 500, corsHeaders);
  }

  const authHeader = req.headers.get("Authorization");
  if (!timingSafeEqualStr(authHeader, expectedAuth)) {
    logStep("ERROR", { message: "Invalid Authorization header" });
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }

  // Service-role client for database writes (same as stripe-webhook)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    let payload: { event?: Record<string, unknown>; api_version?: string };
    try {
      payload = await req.json();
    } catch {
      logStep("Invalid JSON body, acknowledging");
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }

    const event = payload?.event;
    if (!event || typeof event !== "object") {
      logStep("No event in payload, acknowledging");
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }

    const eventId = event.id as string | undefined;
    const eventType = event.type as string | undefined;
    const appUserId = event.app_user_id as string | undefined;
    const productId = event.product_id as string | undefined;
    const expirationAtMs = event.expiration_at_ms as number | null | undefined;
    const purchasedAtMs = event.purchased_at_ms as number | null | undefined;
    const store = event.store as string | undefined;

    logStep("Event received", { eventId, eventType, appUserId, productId, store });

    // TRANSFER events carry transferred_from / transferred_to instead of a
    // usable app_user_id, so they bypass the app_user_id guard below.
    const isTransfer = eventType === "TRANSFER";

    if (!isTransfer) {
      // Anonymous RevenueCat ids cannot be mapped to a Supabase user
      if (!appUserId || appUserId.startsWith("$RCAnonymousID:")) {
        logStep("Anonymous or missing app_user_id, ignoring", { appUserId });
        return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
      }

      if (!isUserUuid(appUserId)) {
        logStep("app_user_id is not a valid UUID, ignoring", { appUserId });
        return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
      }
    }

    // --- Idempotency via processed_webhook_events (shared table with Stripe) ---
    const idempotencyKey = eventId ? `rc_${eventId}` : null;
    if (idempotencyKey) {
      const { data: existingEvent, error: lookupError } = await supabaseClient
        .from("processed_webhook_events")
        .select("id")
        .eq("stripe_event_id", idempotencyKey)
        .maybeSingle();
      if (lookupError) throw new Error(`Idempotency lookup failed: ${lookupError.message}`);

      if (existingEvent) {
        logStep("Event already processed, skipping", { eventId });
        return jsonResponse({ received: true, skipped: true }, 200, corsHeaders);
      }
    }

    const userId = appUserId as string;

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "NON_RENEWING_PURCHASE": {
        // NON_RENEWING_PURCHASE = lifetime one-time purchase (no expiration)
        const planType =
          derivePlanType(productId) ??
          (eventType === "NON_RENEWING_PURCHASE" ? "lifetime" : null);
        const expiresAt = planType === "lifetime" ? null : msToIso(expirationAtMs);
        const startedAt = msToIso(purchasedAtMs) ?? new Date().toISOString();

        const result = await applyGrant(supabaseClient, userId, {
          productId: productId ?? null,
          planType,
          expiresAt,
          startedAt,
        });
        logStep("Purchase event applied", { userId, planType, expiresAt, result });
        break;
      }

      case "CANCELLATION": {
        // Normally: auto-renew turned off — access remains until expires_at,
        // EXPIRATION downgrades later. A refund (e.g. cancel_reason
        // CUSTOMER_SUPPORT) arrives as CANCELLATION whose expiration is
        // already in the past → revoke now (RevenueCat rows only).
        const expMs = typeof expirationAtMs === "number" ? expirationAtMs : null;
        if (expMs !== null && expMs <= Date.now()) {
          await handleExpiration(supabaseClient, userId, productId, expMs, "Cancellation (already expired)");
        } else {
          logStep("Cancellation received, keeping premium until expiry", {
            userId,
            cancelReason: event.cancel_reason,
          });
        }
        break;
      }

      case "EXPIRATION": {
        const expMs = typeof expirationAtMs === "number" ? expirationAtMs : null;
        await handleExpiration(supabaseClient, userId, productId, expMs, "Expiration");
        break;
      }

      case "PRODUCT_CHANGE": {
        // RevenueCat sends the old product in `product_id` and the new one
        // in `new_product_id` for PRODUCT_CHANGE events.
        const newProductId =
          (event.new_product_id as string | undefined) ?? productId ?? null;
        const planType = derivePlanType(newProductId);
        const expiresAt =
          planType === "lifetime" ? null : msToIso(expirationAtMs);

        const { error: updateError } = await supabaseClient
          .from("subscriptions")
          .update({
            product_id: newProductId,
            plan_type: planType,
            expires_at: expiresAt,
          })
          .eq("user_id", userId)
          .eq("provider", "revenuecat");

        if (updateError) throw new Error(`Applying product change failed: ${updateError.message}`);
        logStep("Product change applied", { userId, newProductId, planType });
        break;
      }

      case "TRANSFER": {
        await handleTransfer(supabaseClient, event);
        break;
      }

      default:
        logStep("Unhandled event type", { type: eventType });
    }

    // Marker only after success; unique violation = concurrent duplicate won.
    if (idempotencyKey) {
      const { error: markError } = await supabaseClient
        .from("processed_webhook_events")
        .insert({
          stripe_event_id: idempotencyKey,
          event_type: `revenuecat.${eventType ?? "unknown"}`,
        });
      if (markError && !isUniqueViolation(markError)) {
        logStep("WARN could not record processed event", { eventId, error: markError.message });
      }
    }

    return jsonResponse({ received: true }, 200, corsHeaders);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Unexpected errors surface as 500 so RevenueCat retries the delivery.
    return jsonResponse({ error: errorMessage }, 500, corsHeaders);
  }
});
