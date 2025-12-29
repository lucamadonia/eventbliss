import { useState, useEffect } from "react";
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
  refetch: () => Promise<void>;
}

export function usePremium(): UsePremiumResult {
  const { user, isLoading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const fetchSubscription = async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
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
      } else if (data) {
        const isActive = 
          data.plan === "premium" && 
          (!data.expires_at || new Date(data.expires_at) > new Date());
        
        setIsPremium(isActive);
        setSubscription(data as Subscription);
      } else {
        setIsPremium(false);
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error in usePremium:", err);
      setIsPremium(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [user?.id, authLoading]);

  return {
    isPremium,
    loading: loading || authLoading,
    subscription,
    refetch: fetchSubscription,
  };
}
