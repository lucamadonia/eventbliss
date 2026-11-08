import { describe, expect, it } from "vitest";
import {
  getInvoiceSubscriptionId,
  getPeriodEnd,
  getPeriodStart,
  isCheckoutSessionPaid,
  isRowActive,
  isUniqueViolation,
  pickTransferUsers,
  planVoucherGrant,
  shouldApplyRevenueCatExpiration,
  shouldOverwriteSubscription,
  timingSafeEqualStr,
  unixToIso,
} from "../../supabase/functions/_shared/stripe-compat";

const NOW = Date.parse("2026-11-08T12:00:00.000Z");
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

describe("getPeriodEnd / getPeriodStart (Stripe Basil)", () => {
  it("reads the period from subscription items (Basil shape)", () => {
    const sub = { items: { data: [{ current_period_end: 1_800_000_000, current_period_start: 1_797_000_000 }] } };
    expect(getPeriodEnd(sub)).toBe(1_800_000_000);
    expect(getPeriodStart(sub)).toBe(1_797_000_000);
  });

  it("uses the latest end / earliest start across multiple items", () => {
    const sub = {
      items: {
        data: [
          { current_period_end: 1_800_000_000, current_period_start: 1_797_000_000 },
          { current_period_end: 1_900_000_000, current_period_start: 1_796_000_000 },
        ],
      },
    };
    expect(getPeriodEnd(sub)).toBe(1_900_000_000);
    expect(getPeriodStart(sub)).toBe(1_796_000_000);
  });

  it("falls back to the legacy top-level field", () => {
    expect(getPeriodEnd({ current_period_end: 1_700_000_000, items: { data: [] } })).toBe(1_700_000_000);
  });

  it("returns null (never NaN) when no period is present", () => {
    expect(getPeriodEnd({ items: { data: [{}] } })).toBeNull();
    expect(getPeriodEnd({})).toBeNull();
    expect(getPeriodEnd(null)).toBeNull();
    expect(getPeriodEnd({ current_period_end: NaN })).toBeNull();
    expect(getPeriodEnd({ current_period_end: 0 })).toBeNull();
  });

  it("unixToIso guards invalid values", () => {
    expect(unixToIso(1_800_000_000)).toBe(new Date(1_800_000_000_000).toISOString());
    expect(unixToIso(undefined)).toBeNull();
    expect(unixToIso(NaN)).toBeNull();
    expect(() => unixToIso(getPeriodEnd({}))).not.toThrow();
  });
});

describe("getInvoiceSubscriptionId", () => {
  it("reads Basil invoice.parent.subscription_details.subscription", () => {
    expect(getInvoiceSubscriptionId({ parent: { subscription_details: { subscription: "sub_basil" } } })).toBe("sub_basil");
  });
  it("accepts an expanded subscription object", () => {
    expect(getInvoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: "sub_obj" } } } })).toBe("sub_obj");
  });
  it("falls back to the legacy invoice.subscription", () => {
    expect(getInvoiceSubscriptionId({ subscription: "sub_legacy" })).toBe("sub_legacy");
  });
  it("falls back to line item parent details", () => {
    expect(
      getInvoiceSubscriptionId({
        parent: null,
        lines: { data: [{ parent: { subscription_item_details: { subscription: "sub_line" } } }] },
      }),
    ).toBe("sub_line");
  });
  it("returns null for one-off invoices", () => {
    expect(getInvoiceSubscriptionId({ parent: { subscription_details: null }, lines: { data: [] } })).toBeNull();
    expect(getInvoiceSubscriptionId(null)).toBeNull();
  });
});

describe("isCheckoutSessionPaid", () => {
  it("grants on paid and no_payment_required only", () => {
    expect(isCheckoutSessionPaid({ payment_status: "paid" })).toBe(true);
    expect(isCheckoutSessionPaid({ payment_status: "no_payment_required" })).toBe(true);
    expect(isCheckoutSessionPaid({ payment_status: "unpaid" })).toBe(false);
    expect(isCheckoutSessionPaid({})).toBe(false);
    expect(isCheckoutSessionPaid(null)).toBe(false);
  });
});

describe("isUniqueViolation", () => {
  it("detects 23505 and the duplicate-key message", () => {
    expect(isUniqueViolation({ code: "23505", message: "x" })).toBe(true);
    expect(isUniqueViolation({ message: 'duplicate key value violates unique constraint "x"' })).toBe(true);
    expect(isUniqueViolation({ code: "42P01", message: "relation missing" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe("timingSafeEqualStr", () => {
  it("compares correctly", () => {
    expect(timingSafeEqualStr("Bearer abc", "Bearer abc")).toBe(true);
    expect(timingSafeEqualStr("Bearer abc", "Bearer abd")).toBe(false);
    expect(timingSafeEqualStr("Bearer ab", "Bearer abc")).toBe(false);
    expect(timingSafeEqualStr("", "x")).toBe(false);
    expect(timingSafeEqualStr(null, "x")).toBe(false);
    expect(timingSafeEqualStr("ü", "ü")).toBe(true);
  });
});

describe("shouldOverwriteSubscription (RevenueCat purchase vs existing row)", () => {
  const monthlyIn = (days: number) => ({ lifetime: false, expiresAt: iso(NOW + days * DAY) });
  const lifetimeIn = { lifetime: true, expiresAt: null };

  it("writes when there is no row or the row is inactive", () => {
    expect(shouldOverwriteSubscription(null, monthlyIn(30), NOW)).toBe(true);
    expect(shouldOverwriteSubscription({ plan: "free", provider: "stripe" }, monthlyIn(30), NOW)).toBe(true);
    expect(
      shouldOverwriteSubscription({ plan: "premium", provider: "stripe", expires_at: iso(NOW - DAY) }, monthlyIn(30), NOW),
    ).toBe(true);
  });

  it("never replaces an active Stripe lifetime with a recurring RC purchase", () => {
    const row = { plan: "premium", provider: "stripe", plan_type: "lifetime", expires_at: null };
    expect(shouldOverwriteSubscription(row, monthlyIn(365), NOW)).toBe(false);
    expect(shouldOverwriteSubscription(row, lifetimeIn, NOW)).toBe(true);
  });

  it("never replaces a RevenueCat lifetime with a RevenueCat recurring", () => {
    const row = { plan: "premium", provider: "revenuecat", plan_type: "lifetime", expires_at: null };
    expect(shouldOverwriteSubscription(row, monthlyIn(30), NOW)).toBe(false);
  });

  it("replaces an active Stripe recurring only with a later expiry or lifetime", () => {
    const row = { plan: "premium", provider: "stripe", plan_type: "monthly", expires_at: iso(NOW + 20 * DAY), stripe_subscription_id: "sub_1" };
    expect(shouldOverwriteSubscription(row, monthlyIn(10), NOW)).toBe(false);
    expect(shouldOverwriteSubscription(row, monthlyIn(30), NOW)).toBe(true);
    expect(shouldOverwriteSubscription(row, lifetimeIn, NOW)).toBe(true);
    expect(shouldOverwriteSubscription(row, { lifetime: false, expiresAt: null }, NOW)).toBe(false);
  });

  it("always updates an existing RevenueCat recurring row", () => {
    const row = { plan: "premium", provider: "revenuecat", plan_type: "monthly", expires_at: iso(NOW + 20 * DAY) };
    expect(shouldOverwriteSubscription(row, monthlyIn(5), NOW)).toBe(true);
  });

  it("isRowActive handles bad dates", () => {
    expect(isRowActive({ plan: "premium", expires_at: "not-a-date" }, NOW)).toBe(false);
  });
});

describe("shouldApplyRevenueCatExpiration", () => {
  const exp = (ms: number | null, lifetime = false) => ({ expiringProductIsLifetime: lifetime, expirationAtMs: ms });

  it("only downgrades RevenueCat rows", () => {
    expect(shouldApplyRevenueCatExpiration({ plan: "premium", provider: "stripe", expires_at: iso(NOW) }, exp(NOW))).toBe(false);
    expect(shouldApplyRevenueCatExpiration({ plan: "premium", provider: "manual", expires_at: iso(NOW) }, exp(NOW))).toBe(false);
    expect(shouldApplyRevenueCatExpiration(null, exp(NOW))).toBe(false);
    expect(shouldApplyRevenueCatExpiration({ plan: "premium", provider: "revenuecat", expires_at: iso(NOW) }, exp(NOW))).toBe(true);
  });

  it("does not downgrade a lifetime row when a recurring product expires", () => {
    const row = { plan: "premium", provider: "revenuecat", plan_type: "lifetime", expires_at: null };
    expect(shouldApplyRevenueCatExpiration(row, exp(NOW))).toBe(false);
    expect(shouldApplyRevenueCatExpiration(row, exp(NOW, true))).toBe(true);
  });

  it("ignores an out-of-order expiration when the row already runs longer", () => {
    const row = { plan: "premium", provider: "revenuecat", plan_type: "monthly", expires_at: iso(NOW + 30 * DAY) };
    expect(shouldApplyRevenueCatExpiration(row, exp(NOW))).toBe(false);
    expect(shouldApplyRevenueCatExpiration({ ...row, expires_at: iso(NOW + 30_000) }, exp(NOW))).toBe(true);
  });
});

describe("pickTransferUsers", () => {
  it("maps UUIDs and drops anonymous ids", () => {
    expect(pickTransferUsers([UUID_A, "$RCAnonymousID:abc"], ["$RCAnonymousID:x", UUID_B], isUuid)).toEqual({
      sourceIds: [UUID_A],
      targetId: UUID_B,
    });
  });
  it("handles missing / malformed arrays", () => {
    expect(pickTransferUsers(undefined, "x", isUuid)).toEqual({ sourceIds: [], targetId: null });
  });
  it("never treats the target as a source", () => {
    expect(pickTransferUsers([UUID_A, UUID_B], [UUID_B], isUuid)).toEqual({ sourceIds: [UUID_A], targetId: UUID_B });
  });
});

describe("planVoucherGrant", () => {
  it("grants a fresh trial from now when there is no subscription", () => {
    expect(planVoucherGrant(null, "free_trial", 14, NOW)).toEqual({
      action: "grant",
      expiresAt: iso(NOW + 14 * DAY),
      planType: null,
    });
  });

  it("extends an active manual trial from its current end instead of shortening it", () => {
    const row = { plan: "premium", provider: "manual", expires_at: iso(NOW + 60 * DAY) };
    const plan = planVoucherGrant(row, "free_trial", 30, NOW);
    expect(plan).toEqual({ action: "grant", expiresAt: iso(NOW + 90 * DAY), planType: null });
  });

  it("starts from now when the old subscription already expired", () => {
    const row = { plan: "premium", provider: "stripe", expires_at: iso(NOW - 5 * DAY), stripe_subscription_id: "sub_old" };
    expect(planVoucherGrant(row, "free_trial", 30, NOW)).toEqual({
      action: "grant",
      expiresAt: iso(NOW + 30 * DAY),
      planType: null,
    });
  });

  it("rejects any voucher for an active lifetime", () => {
    const row = { plan: "premium", provider: "stripe", plan_type: "lifetime", expires_at: null };
    expect(planVoucherGrant(row, "free_trial", 30, NOW)).toEqual({ action: "reject", code: "ALREADY_LIFETIME" });
    expect(planVoucherGrant(row, "lifetime", 0, NOW)).toEqual({ action: "reject", code: "ALREADY_LIFETIME" });
  });

  it("rejects while a paid Stripe / RevenueCat subscription is active", () => {
    const stripe = { plan: "premium", provider: "stripe", expires_at: iso(NOW + 10 * DAY), stripe_subscription_id: "sub_1" };
    const rc = { plan: "premium", provider: "revenuecat", expires_at: iso(NOW + 10 * DAY) };
    expect(planVoucherGrant(stripe, "free_trial", 30, NOW)).toEqual({ action: "reject", code: "ACTIVE_PAID_SUBSCRIPTION" });
    expect(planVoucherGrant(rc, "lifetime", 0, NOW)).toEqual({ action: "reject", code: "ACTIVE_PAID_SUBSCRIPTION" });
  });

  it("upgrades an active manual trial to lifetime", () => {
    const row = { plan: "premium", provider: "manual", expires_at: iso(NOW + 5 * DAY) };
    expect(planVoucherGrant(row, "lifetime", 0, NOW)).toEqual({ action: "grant", expiresAt: null, planType: "lifetime" });
  });

  it("defaults invalid trial lengths to 30 days", () => {
    expect(planVoucherGrant(null, "free_trial", NaN, NOW)).toMatchObject({ expiresAt: iso(NOW + 30 * DAY) });
  });
});
