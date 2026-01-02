import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanConfig {
  id: string;
  plan_key: string;
  display_name: string;
  ai_credits_monthly: number;
  price_cents: number;
  price_currency: string;
  billing_interval: string | null;
  stripe_price_id: string | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function usePlanConfigs() {
  return useQuery({
    queryKey: ["plan-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_configs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        features: Array.isArray(item.features) ? item.features : []
      })) as PlanConfig[];
    },
  });
}

export function usePlanConfig(planKey: string) {
  const { data: configs, ...rest } = usePlanConfigs();
  const config = configs?.find(c => c.plan_key === planKey);
  return { data: config, ...rest };
}

export function getAICreditsForPlan(configs: PlanConfig[] | undefined, planKey: string): number {
  if (!configs) return 0;
  const config = configs.find(c => c.plan_key === planKey);
  return config?.ai_credits_monthly || 0;
}
