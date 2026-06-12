import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { isNative } from "@/lib/platform";
import { hasPremiumEntitlement } from "@/lib/revenuecat";

type PlanType = "free" | "monthly" | "yearly" | "lifetime";

interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "premium";
  /** Payment provider that owns this subscription ("stripe" | "revenuecat" | null for manual/voucher). */
  provider?: string | null;
  started_at: string;
  expires_at: string | null;
}

interface UsePremiumResult {
  isPremium: boolean;
  loading: boolean;
  subscription: Subscription | null;
  subscriptionEnd: string | null;
  plan: string;
  planType: PlanType;
  cancelAtPeriodEnd: boolean;
  refetch: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

interface PremiumSnapshot {
  isPremium: boolean;
  subscription: Subscription | null;
  subscriptionEnd: string | null;
  plan: string;
  planType: PlanType;
  cancelAtPeriodEnd: boolean;
}

interface PremiumState extends PremiumSnapshot {
  // Native only: local RevenueCat entitlement. Bridges the gap right after an
  // in-app purchase while the webhook → subscriptions-table sync is still
  // catching up. Always false on web (hasPremiumEntitlement is a no-op there).
  rcPremium: boolean;
}

const FREE_SNAPSHOT: PremiumSnapshot = {
  isPremium: false,
  subscription: null,
  subscriptionEnd: null,
  plan: "free",
  planType: "free",
  cancelAtPeriodEnd: false,
};

async function fetchFromDatabase(
  userId: string,
  prevCancelAtPeriodEnd: boolean
): Promise<PremiumSnapshot> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return FREE_SNAPSHOT;
    }

    if (data) {
      // Check for lifetime (no expiry, no subscription_id)
      const isLifetime = data.plan === "premium" && !data.expires_at && !data.stripe_subscription_id;

      // Check for active subscription with expiry
      const isActiveSubscription =
        data.plan === "premium" &&
        data.expires_at &&
        new Date(data.expires_at) > new Date();

      const isActive = isLifetime || isActiveSubscription;

      // Determine if yearly based on days until expiry
      let detectedPlanType: PlanType = "free";
      if (isLifetime) {
        detectedPlanType = "lifetime";
      } else if (isActiveSubscription && data.expires_at) {
        const daysUntilExpiry = Math.ceil((new Date(data.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        detectedPlanType = daysUntilExpiry > 32 ? "yearly" : "monthly";
      }

      return {
        isPremium: isActive,
        subscription: data as Subscription,
        subscriptionEnd: data.expires_at,
        plan: isActive ? "premium" : "free",
        planType: detectedPlanType,
        // The DB row carries no cancel flag — keep the value that was in
        // effect before this refresh (edge-function value or previous state).
        cancelAtPeriodEnd: prevCancelAtPeriodEnd,
      };
    }

    return FREE_SNAPSHOT;
  } catch (err) {
    console.error("Error in fetchFromDatabase:", err);
    return FREE_SNAPSHOT;
  }
}

async function fetchPremiumState(
  userId: string,
  prev: PremiumState | undefined
): Promise<PremiumState> {
  // In parallel: refresh the local RevenueCat entitlement (native only).
  // On failure keep the previous value (same as before).
  const rcPromise: Promise<boolean> = isNative()
    ? hasPremiumEntitlement().catch(() => prev?.rcPremium ?? false)
    : Promise.resolve(false);

  let snapshot: PremiumSnapshot;
  try {
    // Call the check-subscription edge function
    const { data, error } = await supabase.functions.invoke("check-subscription");

    if (error) {
      console.error("Error checking subscription:", error);
      // Fallback to database check
      snapshot = await fetchFromDatabase(userId, prev?.cancelAtPeriodEnd ?? false);
    } else if (data) {
      // Edge function sets the cancel flag; the subsequent DB refresh is
      // authoritative for everything else (same precedence as before).
      snapshot = await fetchFromDatabase(userId, data.cancel_at_period_end || false);
    } else {
      // No error and no data: previously the state was simply left untouched.
      snapshot = prev ?? FREE_SNAPSHOT;
    }
  } catch (err) {
    console.error("Error in checkSubscription:", err);
    snapshot = await fetchFromDatabase(userId, prev?.cancelAtPeriodEnd ?? false);
  }

  return { ...snapshot, rcPremium: await rcPromise };
}

export function usePremium(): UsePremiumResult {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["premium", userId],
    enabled: !!userId && !authLoading,
    staleTime: 55_000,
    // Periodic check every minute (replaces the per-hook setInterval —
    // TanStack dedupes this across all observers into a single call).
    refetchInterval: 60_000,
    queryFn: () =>
      fetchPremiumState(
        userId!,
        queryClient.getQueryData<PremiumState>(["premium", userId])
      ),
  });

  const queryRefetch = query.refetch;
  const refetch = useCallback(async () => {
    if (!userId) return;
    await queryRefetch();
  }, [userId, queryRefetch]);

  const data = query.data;

  return {
    isPremium: (data?.isPremium ?? false) || (data?.rcPremium ?? false),
    loading: authLoading || (query.isPending && !!userId),
    subscription: data?.subscription ?? null,
    subscriptionEnd: data?.subscriptionEnd ?? null,
    plan: data?.plan ?? "free",
    planType: data?.planType ?? "free",
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
    refetch,
    checkSubscription: refetch,
  };
}
