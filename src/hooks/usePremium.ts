import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "premium";
  started_at: string;
  expires_at: string | null;
}

interface UsePremiumResult {
  isPremium: boolean;
  loading: boolean;
  subscription: Subscription | null;
  subscriptionEnd: string | null;
  plan: string;
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

  const checkSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Call the check-subscription edge function
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        // Fallback to database check
        await fetchFromDatabase();
      } else if (data) {
        setIsPremium(data.subscribed);
        setPlan(data.plan || "free");
        setSubscriptionEnd(data.subscription_end);
        
        // Also refresh local subscription data
        await fetchFromDatabase();
      }
    } catch (err) {
      console.error("Error in checkSubscription:", err);
      await fetchFromDatabase();
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchFromDatabase = async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
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
      } else if (data) {
        const isActive = 
          data.plan === "premium" && 
          (!data.expires_at || new Date(data.expires_at) > new Date());
        
        setIsPremium(isActive);
        setSubscription(data as Subscription);
        setSubscriptionEnd(data.expires_at);
        setPlan(isActive ? "premium" : "free");
      } else {
        setIsPremium(false);
        setSubscription(null);
        setSubscriptionEnd(null);
        setPlan("free");
      }
    } catch (err) {
      console.error("Error in fetchFromDatabase:", err);
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
    }
  };

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setSubscriptionEnd(null);
      setPlan("free");
      setLoading(false);
      return;
    }

    setLoading(true);
    await fetchFromDatabase();
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [user?.id, authLoading, fetchSubscription]);

  // Periodic check every minute
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user?.id, checkSubscription]);

  return {
    isPremium,
    loading: loading || authLoading,
    subscription,
    subscriptionEnd,
    plan,
    refetch: fetchSubscription,
    checkSubscription,
  };
}
