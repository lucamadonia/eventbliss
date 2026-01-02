export type PlanType = "free" | "monthly" | "yearly" | "lifetime";

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
