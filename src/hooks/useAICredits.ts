import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePremium } from "./usePremium";
import { usePlanConfigs } from "./usePlanConfigs";
import { getStartOfMonth, getNextMonthReset } from "@/lib/ai-credits";

interface AICredits {
  used: number;
  limit: number;
  remaining: number;
  resetDate: Date;
  bonusCredits: number;
}

export function useAICredits() {
  const { user } = useAuth();
  const { planType } = usePremium();
  const { data: planConfigs, isLoading: planConfigsLoading } = usePlanConfigs();
  const [credits, setCredits] = useState<AICredits>({
    used: 0,
    limit: 0,
    remaining: 0,
    resetDate: getNextMonthReset(),
    bonusCredits: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get AI credits for a plan from plan_configs table
  const getAICreditsForPlan = useCallback((planKey: string): number => {
    if (!planConfigs || planConfigs.length === 0) {
      // Fallback values if no config loaded
      const fallbacks: Record<string, number> = {
        free: 0,
        monthly: 50,
        yearly: 100,
        lifetime: 75,
      };
      return fallbacks[planKey] || 0;
    }
    
    const config = planConfigs.find((c) => c.plan_key === planKey);
    return config?.ai_credits_monthly || 0;
  }, [planConfigs]);

  const fetchCredits = useCallback(async () => {
    if (!user?.id || planConfigsLoading) {
      if (!planConfigsLoading) {
        setCredits({
          used: 0,
          limit: 0,
          remaining: 0,
          resetDate: getNextMonthReset(),
          bonusCredits: 0,
        });
        setLoading(false);
      }
      return;
    }

    try {
      const startOfMonth = getStartOfMonth();

      // Get usage count
      const { count, error } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (error) {
        console.error("Error fetching AI usage:", error);
      }

      // Get bonus credits from adjustments
      const { data: adjustments } = await supabase
        .from("ai_credit_adjustments")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      const bonusCredits = adjustments?.reduce((sum, adj) => sum + adj.amount, 0) || 0;
      // Get credits dynamically from plan_configs table
      const baseLimit = getAICreditsForPlan(planType);
      const effectiveLimit = baseLimit + bonusCredits;
      const used = count || 0;

      setCredits({
        used,
        limit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - used),
        resetDate: getNextMonthReset(),
        bonusCredits,
      });
    } catch (err) {
      console.error("Error in fetchCredits:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, planType, planConfigsLoading, getAICreditsForPlan]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    ...credits,
    loading: loading || planConfigsLoading,
    refetch: fetchCredits,
  };
}
