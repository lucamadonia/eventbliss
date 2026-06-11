import {
  Purchases,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from '@revenuecat/purchases-capacitor';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { isNative, isIOS, isAndroid } from './platform';

/** Entitlement ID configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT_ID = 'premium';

/** Offering ID configured in the RevenueCat dashboard. */
export const PREMIUM_OFFERING_ID = 'default';

export type PremiumPlan = 'monthly' | 'yearly' | 'lifetime';

/** Store product identifiers (App Store Connect / Google Play Console). */
export const RC_PRODUCT_IDS: Record<PremiumPlan, string> = {
  monthly: 'eventbliss_premium_monthly',
  yearly: 'eventbliss_premium_yearly',
  lifetime: 'eventbliss_premium_lifetime',
};

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  customerInfo?: CustomerInfo;
}

// Resolves to true once Purchases.configure() succeeded. Shared so that
// logIn/getOfferings/purchase calls can await app-start initialization.
let initPromise: Promise<boolean> | null = null;

function getApiKey(): string | undefined {
  if (isIOS()) return import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined;
  if (isAndroid()) return import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined;
  return undefined;
}

/**
 * Configure the RevenueCat SDK. Native only — no-op on web.
 * Safe to call multiple times; only the first call configures.
 * Missing API key logs a warning and disables purchases (app must not crash).
 */
export function initRevenueCat(userId?: string): Promise<boolean> {
  if (!isNative()) return Promise.resolve(false);

  if (!initPromise) {
    initPromise = (async () => {
      const apiKey = getApiKey();
      if (!apiKey) {
        console.warn(
          '[RevenueCat] Missing API key (VITE_REVENUECAT_IOS_KEY / VITE_REVENUECAT_ANDROID_KEY) — in-app purchases disabled.'
        );
        return false;
      }
      try {
        if (import.meta.env.DEV) {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        }
        await Purchases.configure({ apiKey, appUserID: userId ?? null });
        return true;
      } catch (e) {
        console.warn('[RevenueCat] configure failed:', e);
        return false;
      }
    })();
  }
  return initPromise;
}

async function ensureConfigured(): Promise<boolean> {
  if (!isNative()) return false;
  return initRevenueCat();
}

/** Link the RevenueCat app user to the Supabase user id. Fault-tolerant. */
export async function logInRevenueCat(userId: string): Promise<void> {
  if (!(await ensureConfigured())) return;
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (e) {
    console.warn('[RevenueCat] logIn failed:', e);
  }
}

/** Log out of RevenueCat (back to anonymous app user). Fault-tolerant. */
export async function logOutRevenueCat(): Promise<void> {
  if (!(await ensureConfigured())) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    // Logging out an anonymous user throws LOG_OUT_ANONYMOUS_USER_ERROR — harmless.
    console.warn('[RevenueCat] logOut failed:', e);
  }
}

/**
 * Load the current premium offering (with its packages).
 * Returns null on web, when not configured, or on store errors.
 */
export async function getPremiumOfferings(): Promise<PurchasesOffering | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? offerings.all[PREMIUM_OFFERING_ID] ?? null;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings failed:', e);
    return null;
  }
}

/**
 * Find the RC package for one of our premium plans inside an offering.
 * Primary mapping: store product identifier (eventbliss_premium_*).
 * Fallback: predefined package type (MONTHLY / ANNUAL / LIFETIME).
 */
export function findPremiumPackage(
  offering: PurchasesOffering,
  plan: PremiumPlan
): PurchasesPackage | null {
  const productId = RC_PRODUCT_IDS[plan];
  const byProduct = offering.availablePackages.find(
    (pkg) =>
      pkg.product.identifier === productId ||
      // Android subscription products are reported as "productId:basePlanId"
      pkg.product.identifier.startsWith(`${productId}:`)
  );
  if (byProduct) return byProduct;

  switch (plan) {
    case 'monthly':
      return offering.monthly;
    case 'yearly':
      return offering.annual;
    case 'lifetime':
      return offering.lifetime;
  }
}

/**
 * Purchase a package. User cancellation is reported as
 * `{ success: false, cancelled: true }` instead of an error.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!(await ensureConfigured())) return { success: false };
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return { success: true, customerInfo };
  } catch (e) {
    const err = e as { code?: unknown; userCancelled?: boolean | null };
    const cancelled =
      err?.userCancelled === true ||
      String(err?.code) === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
    if (cancelled) return { success: false, cancelled: true };
    console.warn('[RevenueCat] purchase failed:', e);
    return { success: false };
  }
}

/**
 * Check whether the `premium` entitlement is active.
 * Without an argument, fetches the current customer info from the SDK.
 */
export async function hasPremiumEntitlement(customerInfo?: CustomerInfo): Promise<boolean> {
  if (customerInfo) {
    return PREMIUM_ENTITLEMENT_ID in (customerInfo.entitlements?.active ?? {});
  }
  if (!(await ensureConfigured())) return false;
  try {
    const { customerInfo: info } = await Purchases.getCustomerInfo();
    return PREMIUM_ENTITLEMENT_ID in (info.entitlements?.active ?? {});
  } catch (e) {
    console.warn('[RevenueCat] getCustomerInfo failed:', e);
    return false;
  }
}

/** Restore previous purchases (required by Apple). Returns null on failure/web. */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!(await ensureConfigured())) return null;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo;
  } catch (e) {
    console.warn('[RevenueCat] restorePurchases failed:', e);
    return null;
  }
}
