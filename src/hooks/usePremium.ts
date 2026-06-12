import { useState, useEffect, useCallback } from "react";
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

export function usePremium(): UsePremiumResult {
  const { user, isLoading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [planType, setPlanType] = useState<PlanType>("free");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  // Native only: local RevenueCat entitlement. Bridges the gap right after an
  // in-app purchase while the webhook → subscriptions-table sync is still
  // catching up. Always false on web (hasPremiumEntitlement is a no-op there).
  const [rcPremium, setRcPremium] = useState(false);

  const refreshRcEntitlement = useCallback(async () => {
    if (!isNative() || !user?.id) {
      setRcPremium(false);
      return;
    }
    try {
      setRcPremium(await hasPremiumEntitlement());
    } catch {
      /* keep previous value */
    }
  }, [user?.id]);

  const checkSubscription = useCallback(async () => {
    if (!user?.id) {
      setRcPremium(false);
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
      setPlanType("free");
      setCancelAtPeriodEnd(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // In parallel: refresh the local RevenueCat entitlement (native only)
      void refreshRcEntitlement();

      // Call the check-subscription edge function
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        // Fallback to database check
        await fetchFromDatabase();
      } else if (data) {
        setIsPremium(data.subscribed);
        setPlan(data.plan || "free");
        setPlanType(data.plan_type || "free");
        setSubscriptionEnd(data.subscription_end);
        setCancelAtPeriodEnd(data.cancel_at_period_end || false);
        
        // Also refresh local subscription data
        await fetchFromDatabase();
      }
    } catch (err) {
      console.error("Error in checkSubscription:", err);
      await fetchFromDatabase();
    } finally {
      setLoading(false);
    }
  }, [user?.id, refreshRcEntitlement]);

  const fetchFromDatabase = async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
      setPlanType("free");
      setCancelAtPeriodEnd(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        setIsPremium(false);
        setSubscription(null);
        setSubscriptionEnd(null);
        setPlan("free");
        setPlanType("free");
        setCancelAtPeriodEnd(false);
      } else if (data) {
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
        
        setIsPremium(isActive);
        setSubscription(data as Subscription);
        setSubscriptionEnd(data.expires_at);
        setPlan(isActive ? "premium" : "free");
        setPlanType(detectedPlanType);
      } else {
        setIsPremium(false);
        setSubscription(null);
        setSubscriptionEnd(null);
        setPlan("free");
        setPlanType("free");
        setCancelAtPeriodEnd(false);
      }
    } catch (err) {
      console.error("Error in fetchFromDatabase:", err);
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
      setPlanType("free");
      setCancelAtPeriodEnd(false);
    }
  };

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
      setPlanType("free");
      setCancelAtPeriodEnd(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    void refreshRcEntitlement();
    await fetchFromDatabase();
    setLoading(false);
  }, [user?.id, refreshRcEntitlement]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [user?.id, authLoading, fetchSubscription]);

  // Listen for auth state changes and check subscription on login
  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Immediately check subscription status on login
          checkSubscription();
        } else if (event === "SIGNED_OUT") {
          setRcPremium(false);
          setIsPremium(false);
          setSubscription(null);
          setSubscriptionEnd(null);
          setPlan("free");
          setPlanType("free");
          setCancelAtPeriodEnd(false);
        }
      }
    );
    return () => authSubscription.unsubscribe();
  }, [checkSubscription]);

  // Periodic check every minute
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user?.id, checkSubscription]);

  return {
    isPremium: isPremium || rcPremium,
    loading: loading || authLoading,
    subscription,
    subscriptionEnd,
    plan,
    planType,
    cancelAtPeriodEnd,
    refetch: fetchSubscription,
    checkSubscription,
  };
}
