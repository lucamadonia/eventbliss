import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceTierFeatures {
  tier: "starter" | "professional" | "enterprise";
  displayName: string;
  maxListings: number;
  hasProfilePage: boolean;
  hasFeaturedListings: boolean;
  hasAiIntegration: boolean;
  searchBoost: number;
  commissionRate: number;
  priceCents: number;
  billingInterval: string | null;
  features: string[];
  isActive: boolean;
}

export function useMarketplaceTier(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["marketplace-tier", agencyId],
    enabled: !!agencyId,
    queryFn: async (): Promise<MarketplaceTierFeatures> => {
      // Get agency's subscription
      const { data: sub } = await (supabase.from as any)("agency_marketplace_subscriptions")
        .select("tier, is_active")
        .eq("agency_id", agencyId)
        .maybeSingle();

      const tier = sub?.is_active ? (sub.tier || "starter") : "starter";

      // Get tier config
      const { data: config } = await (supabase.from as any)("marketplace_plan_configs")
        .select("*")
        .eq("tier", tier)
        .single();

      if (!config) {
        return {
          tier: "starter", displayName: "Starter", maxListings: 3,
          hasProfilePage: false, hasFeaturedListings: false, hasAiIntegration: false,
          searchBoost: 1, commissionRate: 10, priceCents: 0,
          billingInterval: null, features: [], isActive: true,
        };
      }

      return {
        tier: config.tier,
        displayName: config.display_name,
        maxListings: config.max_listings,
        hasProfilePage: config.has_profile_page,
        hasFeaturedListings: config.has_featured_listings,
        hasAiIntegration: config.has_ai_integration,
        searchBoost: config.search_boost_factor,
        commissionRate: config.commission_rate_percent,
        priceCents: config.price_cents,
        billingInterval: config.billing_interval,
        features: config.features || [],
        isActive: true,
      };
    },
  });
}

/** Fetch all marketplace plan configs (for tier comparison display) */
export function useMarketplacePlanConfigs() {
  return useQuery({
    queryKey: ["marketplace-plan-configs"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("marketplace_plan_configs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60_000,
  });
}
