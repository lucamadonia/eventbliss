export type PlanType = "free" | "monthly" | "yearly" | "lifetime";

/**
 * FALLBACK ONLY - These values are used as fallback when plan_configs table is not accessible.
 * The actual credit limits are loaded dynamically from the plan_configs database table.
 * To change credit limits, update the plan_configs table via Admin Panel → Settings.
 * 
 * @deprecated Use plan_configs table instead. This is only for edge functions or server-side code.
 */
export const AI_CREDIT_LIMITS: Record<PlanType, number> = {
  free: 0,
  monthly: 50,
  yearly: 100,
  lifetime: 75,
};

// Bonus credits for verified agencies (affiliates)
export const AGENCY_CREDIT_BONUS = 50;

export function getNextMonthReset(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
