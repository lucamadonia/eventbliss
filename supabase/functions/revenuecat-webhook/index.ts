import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// RevenueCat webhook (Webhook v1 format) for native in-app purchases.
//
// The frontend calls Purchases.logIn(user.id), so `app_user_id` is the
// Supabase auth user UUID. Anonymous RevenueCat ids ($RCAnonymousID:...)
// are acknowledged with 200 and ignored — they cannot be mapped to a user.
//
// Auth: RevenueCat sends the configured Authorization header value verbatim;
// we compare it against the REVENUECAT_WEBHOOK_AUTH secret.

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REVENUECAT-WEBHOOK] ${step}${detailsStr}`);
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: compare Authorization header with configured secret ---
  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expectedAuth) {
    logStep("ERROR", { message: "REVENUECAT_WEBHOOK_AUTH is not set" });
    return jsonResponse({ error: "Server configuration error" }, 500, corsHeaders);
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== expectedAuth) {
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

    // Anonymous RevenueCat ids cannot be mapped to a Supabase user
    if (!appUserId || appUserId.startsWith("$RCAnonymousID:")) {
      logStep("Anonymous or missing app_user_id, ignoring", { appUserId });
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }

    if (!UUID_REGEX.test(appUserId)) {
      logStep("app_user_id is not a valid UUID, ignoring", { appUserId });
      return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
    }

    // --- Idempotency via processed_webhook_events (shared with Stripe) ---
    if (eventId) {
      const idempotencyKey = `rc_${eventId}`;
      const { data: existingEvent } = await supabaseClient
        .from("processed_webhook_events")
        .select("id")
        .eq("stripe_event_id", idempotencyKey)
        .maybeSingle();

      if (existingEvent) {
        logStep("Event already processed, skipping", { eventId });
        return jsonResponse({ received: true, skipped: true }, 200, corsHeaders);
      }

      await supabaseClient.from("processed_webhook_events").insert({
        stripe_event_id: idempotencyKey,
        event_type: `revenuecat.${eventType ?? "unknown"}`,
      });
    }

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "NON_RENEWING_PURCHASE": {
        // NON_RENEWING_PURCHASE = lifetime one-time purchase (no expiration)
        const planType =
          derivePlanType(productId) ??
          (eventType === "NON_RENEWING_PURCHASE" ? "lifetime" : null);
        const expiresAt =
          planType === "lifetime" ? null : msToIso(expirationAtMs);
        const startedAt = msToIso(purchasedAtMs) ?? new Date().toISOString();

        const { error: upsertError } = await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: appUserId,
            plan: "premium",
            provider: "revenuecat",
            product_id: productId ?? null,
            plan_type: planType,
            started_at: startedAt,
            expires_at: expiresAt,
            stripe_subscription_id: null,
            stripe_customer_id: null,
          }, { onConflict: "user_id" });

        if (upsertError) {
          logStep("ERROR upserting subscription", { error: upsertError.message });
        } else {
          logStep("Premium subscription upserted", {
            userId: appUserId,
            planType,
            expiresAt,
          });
        }
        break;
      }

      case "CANCELLATION": {
        // Auto-renew turned off — access remains until expires_at, so the
        // plan stays 'premium'. EXPIRATION will downgrade later.
        logStep("Cancellation received, keeping premium until expiry", {
          userId: appUserId,
        });
        break;
      }

      case "EXPIRATION": {
        // Only downgrade subscriptions owned by RevenueCat — never touch
        // Stripe or manually granted subscriptions.
        const { error: updateError } = await supabaseClient
          .from("subscriptions")
          .update({ plan: "free", expires_at: null })
          .eq("user_id", appUserId)
          .eq("provider", "revenuecat");

        if (updateError) {
          logStep("ERROR downgrading subscription", { error: updateError.message });
        } else {
          logStep("Subscription expired, downgraded to free", { userId: appUserId });
        }
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
          .eq("user_id", appUserId)
          .eq("provider", "revenuecat");

        if (updateError) {
          logStep("ERROR applying product change", { error: updateError.message });
        } else {
          logStep("Product change applied", {
            userId: appUserId,
            newProductId,
            planType,
          });
        }
        break;
      }

      case "TRANSFER": {
        // TODO: A TRANSFER moves entitlements between app_user_ids
        // (event.transferred_from / event.transferred_to). Proper handling
        // would move the subscription row from the old user to the new one.
        // For now we acknowledge and log so RevenueCat does not retry.
        logStep("TRANSFER event received (not yet handled)", {
          transferredFrom: event.transferred_from,
          transferredTo: event.transferred_to,
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: eventType });
    }

    return jsonResponse({ received: true }, 200, corsHeaders);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Unexpected errors surface as 500 so RevenueCat retries the delivery.
    return jsonResponse({ error: errorMessage }, 500, corsHeaders);
  }
});
