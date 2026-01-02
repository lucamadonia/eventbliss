import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePremium } from "./usePremium";
import { AI_CREDIT_LIMITS, getStartOfMonth, getNextMonthReset, PlanType } from "@/lib/ai-credits";

interface AICredits {
  used: number;
  limit: number;
  remaining: number;
  resetDate: Date;
}

export function useAICredits() {
  const { user } = useAuth();
  const { planType } = usePremium();
  const [credits, setCredits] = useState<AICredits>({
    used: 0,
    limit: 0,
    remaining: 0,
    resetDate: getNextMonthReset(),
  });
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setCredits({
        used: 0,
        limit: 0,
        remaining: 0,
        resetDate: getNextMonthReset(),
      });
      setLoading(false);
      return;
    }

    try {
      const startOfMonth = getStartOfMonth();

      const { count, error } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (error) {
        console.error("Error fetching AI usage:", error);
      }

      const limit = AI_CREDIT_LIMITS[planType as PlanType] || 0;
      const used = count || 0;

      setCredits({
        used,
        limit,
        remaining: Math.max(0, limit - used),
        resetDate: getNextMonthReset(),
      });
    } catch (err) {
      console.error("Error in fetchCredits:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, planType]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    ...credits,
    loading,
    refetch: fetchCredits,
  };
}
