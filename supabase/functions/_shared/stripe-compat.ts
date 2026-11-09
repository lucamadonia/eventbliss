// Pure payment helpers shared by the Stripe / RevenueCat / voucher functions.
//
// Deliberately import-free (no Deno, no esm.sh) so the same file runs in the
// Edge Runtime AND under vitest (node). Only structural types are used.
//
// Background — Stripe API "2025-03-31.basil" and later (we pin
// "2025-08-27.basil"):
//   * Subscription.current_period_start / current_period_end were REMOVED
//     from the subscription and now live on each subscription item.
//   * Invoice.subscription was REMOVED; it lives at
//     invoice.parent.subscription_details.subscription (and per line item at
//     line.parent.subscription_item_details.subscription).
// Reading the old fields yields `undefined` → `new Date(NaN).toISOString()`
// throws a RangeError and the whole webhook 500s.

/* ------------------------------------------------------------------ */
/* Stripe shape helpers                                                */
/* ------------------------------------------------------------------ */

type IdOrObject = string | { id?: string | null } | null | undefined;

export interface SubscriptionLike {
  current_period_end?: number | null;
  current_period_start?: number | null;
  items?: {
    data?: Array<{
      current_period_end?: number | null;
      current_period_start?: number | null;
    } | null> | null;
  } | null;
}

export interface InvoiceLike {
  subscription?: IdOrObject;
  parent?: {
    subscription_details?: { subscription?: IdOrObject } | null;
  } | null;
  lines?: {
    data?: Array<{
      subscription?: IdOrObject;
      parent?: {
        subscription_item_details?: { subscription?: IdOrObject } | null;
      } | null;
    } | null> | null;
  } | null;
}

function isValidUnixSeconds(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function idOf(v: IdOrObject): string | null {
  if (!v) return null;
  if (typeof v === "string") return v || null;
  return typeof v.id === "string" && v.id ? v.id : null;
}

function pickItemPeriod(
  sub: SubscriptionLike | null | undefined,
  key: "current_period_end" | "current_period_start",
): number | null {
  if (!sub) return null;
  const items = sub.items?.data ?? [];
  const values = items
    .map((it) => it?.[key])
    .filter(isValidUnixSeconds);
  if (values.length > 0) {
    // Multi-item subscriptions can have differing periods; the end of access
    // is the latest end, the start is the earliest start.
    return key === "current_period_end" ? Math.max(...values) : Math.min(...values);
  }
  const legacy = sub[key];
  return isValidUnixSeconds(legacy) ? legacy : null;
}

/** Period end (unix seconds) for Basil and pre-Basil payloads; null if absent. Never NaN. */
export function getPeriodEnd(sub: SubscriptionLike | null | undefined): number | null {
  return pickItemPeriod(sub, "current_period_end");
}

/** Period start (unix seconds) for Basil and pre-Basil payloads; null if absent. */
export function getPeriodStart(sub: SubscriptionLike | null | undefined): number | null {
  return pickItemPeriod(sub, "current_period_start");
}

/** Unix seconds → ISO string, or null for missing / invalid input. */
export function unixToIso(seconds: number | null | undefined): string | null {
  return isValidUnixSeconds(seconds) ? new Date(seconds * 1000).toISOString() : null;
}

/** Subscription id an invoice belongs to (Basil `parent` shape first, legacy fallback). */
export function getInvoiceSubscriptionId(inv: InvoiceLike | null | undefined): string | null {
  if (!inv) return null;
  const fromParent = idOf(inv.parent?.subscription_details?.subscription);
  if (fromParent) return fromParent;
  const legacy = idOf(inv.subscription);
  if (legacy) return legacy;
  for (const line of inv.lines?.data ?? []) {
    const fromLine =
      idOf(line?.parent?.subscription_item_details?.subscription) ?? idOf(line?.subscription);
    if (fromLine) return fromLine;
  }
  return null;
}

/**
 * Checkout grants access only once money actually moved. `unpaid` happens for
 * delayed payment methods (SEPA, Sofort, …) — those finish later via
 * `checkout.session.async_payment_succeeded`. `no_payment_required` covers a
 * 100 % coupon or a subscription trial.
 */
export function isCheckoutSessionPaid(
  session: { payment_status?: string | null } | null | undefined,
): boolean {
  const s = session?.payment_status;
  return s === "paid" || s === "no_payment_required";
}

/* ------------------------------------------------------------------ */
/* Webhook idempotency                                                 */
/* ------------------------------------------------------------------ */

/** Postgres unique_violation (23505) as surfaced by PostgREST / supabase-js. */
export function isUniqueViolation(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  return /duplicate key value/i.test(error.message ?? "");
}

/* ------------------------------------------------------------------ */
/* Constant-time secret comparison                                      */
/* ------------------------------------------------------------------ */

/**
 * Compares two strings without short-circuiting on the first differing byte.
 * Always walks the longer input so timing does not reveal the matching prefix.
 * (Length itself still leaks, which is acceptable for a fixed shared secret.)
 */
export function timingSafeEqualStr(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  const len = Math.max(x.length, y.length);
  let diff = x.length ^ y.length;
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* Subscription ownership decisions                                     */
/* ------------------------------------------------------------------ */

export interface SubscriptionRow {
  plan?: string | null;
  provider?: string | null;
  plan_type?: string | null;
  expires_at?: string | null;
  stripe_subscription_id?: string | null;
}

/** premium AND (no expiry OR expiry in the future). */
export function isRowActive(row: SubscriptionRow | null | undefined, nowMs: number): boolean {
  if (!row || row.plan !== "premium") return false;
  if (!row.expires_at) return true;
  const t = Date.parse(row.expires_at);
  return Number.isFinite(t) && t > nowMs;
}

/** An active premium row without expiry (or explicitly typed lifetime). */
export function isRowLifetime(row: SubscriptionRow | null | undefined, nowMs: number): boolean {
  if (!isRowActive(row, nowMs)) return false;
  return row!.plan_type === "lifetime" || !row!.expires_at;
}

export interface IncomingGrant {
  /** true for a lifetime / non-expiring entitlement */
  lifetime: boolean;
  /** ISO expiry of the incoming entitlement (ignored when lifetime) */
  expiresAt: string | null;
}

/**
 * Should a RevenueCat purchase event overwrite the user's single
 * `subscriptions` row (UNIQUE(user_id))?
 *
 *  - no row / inactive row / row already owned by RevenueCat → yes,
 *    except a RevenueCat lifetime is never replaced by a RevenueCat recurring.
 *  - active lifetime from another provider → only by another lifetime.
 *  - active Stripe / manual row with expiry → only if the incoming grant is
 *    lifetime or ends strictly later.
 */
export function shouldOverwriteSubscription(
  existing: SubscriptionRow | null | undefined,
  incoming: IncomingGrant,
  nowMs: number,
): boolean {
  if (!existing || !isRowActive(existing, nowMs)) return true;

  if (isRowLifetime(existing, nowMs)) return incoming.lifetime;

  if (existing.provider === "revenuecat") return true;

  if (incoming.lifetime) return true;
  const inc = incoming.expiresAt ? Date.parse(incoming.expiresAt) : NaN;
  const cur = existing.expires_at ? Date.parse(existing.expires_at) : NaN;
  if (!Number.isFinite(inc)) return false;
  if (!Number.isFinite(cur)) return true;
  return inc > cur;
}

/**
 * May a RevenueCat EXPIRATION (or refund-style CANCELLATION) downgrade this row?
 * Only RevenueCat-owned rows; never a lifetime row because a recurring product
 * expired; never when the row already runs past the expiring entitlement
 * (out-of-order delivery after a RENEWAL / re-purchase).
 */
export function shouldApplyRevenueCatExpiration(
  existing: SubscriptionRow | null | undefined,
  event: { expiringProductIsLifetime: boolean; expirationAtMs: number | null },
): boolean {
  if (!existing || existing.provider !== "revenuecat") return false;
  if (existing.plan !== "premium") return false;
  const rowIsLifetime = existing.plan_type === "lifetime" || !existing.expires_at;
  if (rowIsLifetime && !event.expiringProductIsLifetime) return false;
  if (existing.expires_at && event.expirationAtMs != null) {
    const rowEnd = Date.parse(existing.expires_at);
    // 60 s tolerance for clock / rounding differences between RC and our ISO.
    if (Number.isFinite(rowEnd) && rowEnd > event.expirationAtMs + 60_000) return false;
  }
  return true;
}

/**
 * RevenueCat TRANSFER payload: `transferred_from` / `transferred_to` are
 * arrays of app_user_ids (may include $RCAnonymousID aliases). Returns the
 * Supabase user UUIDs that can actually be mapped.
 */
export function pickTransferUsers(
  from: unknown,
  to: unknown,
  isValidUserId: (id: string) => boolean,
): { sourceIds: string[]; targetId: string | null } {
  const clean = (v: unknown): string[] =>
    Array.isArray(v)
      ? [...new Set(v.filter((x): x is string => typeof x === "string" && isValidUserId(x)))]
      : [];
  const targets = clean(to);
  const targetId = targets[0] ?? null;
  const sourceIds = clean(from).filter((id) => id !== targetId);
  return { sourceIds, targetId };
}

/* ------------------------------------------------------------------ */
/* Voucher grant planning                                              */
/* ------------------------------------------------------------------ */

export type VoucherGrantPlan =
  | { action: "grant"; expiresAt: string | null; planType: string | null }
  | { action: "reject"; code: "ALREADY_LIFETIME" | "ACTIVE_PAID_SUBSCRIPTION" };

/**
 * Decide how a lifetime / free_trial voucher changes the user's row.
 * Never shortens or silently replaces an existing longer entitlement:
 *  - active lifetime                 → reject ALREADY_LIFETIME
 *  - active paid Stripe / RevenueCat → reject ACTIVE_PAID_SUBSCRIPTION
 *    (the provider webhooks would overwrite the grant and the user would keep
 *    being billed; they must cancel first)
 *  - active manual / trial           → free_trial extends from the current end
 *  - none / expired                  → trial from now, lifetime = no expiry
 */
export function planVoucherGrant(
  existing: SubscriptionRow | null | undefined,
  voucherType: "lifetime" | "free_trial",
  trialDays: number,
  nowMs: number,
): VoucherGrantPlan {
  const active = isRowActive(existing, nowMs);
  if (active && isRowLifetime(existing, nowMs)) {
    return { action: "reject", code: "ALREADY_LIFETIME" };
  }
  const paidProvider =
    existing?.provider === "revenuecat" ||
    (existing?.provider === "stripe" && !!existing?.stripe_subscription_id);
  if (active && paidProvider) {
    return { action: "reject", code: "ACTIVE_PAID_SUBSCRIPTION" };
  }

  if (voucherType === "lifetime") {
    return { action: "grant", expiresAt: null, planType: "lifetime" };
  }

  const days = Number.isFinite(trialDays) && trialDays > 0 ? trialDays : 30;
  const currentEnd = active && existing?.expires_at ? Date.parse(existing.expires_at) : NaN;
  const base = Number.isFinite(currentEnd) && currentEnd > nowMs ? currentEnd : nowMs;
  return {
    action: "grant",
    expiresAt: new Date(base + days * 86_400_000).toISOString(),
    planType: null,
  };
}
