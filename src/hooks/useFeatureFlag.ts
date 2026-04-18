import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FeatureFlagRow {
  key: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_tiers: string[] | null;
}

// Deterministic 0-99 bucket per user id so the same user sees the same
// state across sessions and devices. Fowler-Noll-Vo-ish lightweight hash —
// doesn't need to be crypto-grade, just stable and evenly distributed.
function bucketFor(userId: string | null | undefined, flagKey: string): number {
  if (!userId) return 100; // logged-out users never opted in
  const str = `${flagKey}:${userId}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

/**
 * useFeatureFlag — reads the `feature_flags` row by key and decides
 * whether the *current user* is in the rollout bucket. Returns an
 * `{ enabled, isLoading }` shape so callers can fall back to v1 while
 * the flag is fetching.
 *
 * A flag counts as ENABLED when:
 *   - row exists, `is_enabled = true`, AND
 *   - user's deterministic bucket < rollout_percentage
 *
 * Not-logged-in users are never in the rollout.
 */
export function useFeatureFlag(flagKey: string): { enabled: boolean; isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["feature-flag", flagKey],
    queryFn: async (): Promise<FeatureFlagRow | null> => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, is_enabled, rollout_percentage, target_tiers")
        .eq("key", flagKey)
        .maybeSingle();
      if (error) return null;
      return (data as FeatureFlagRow) ?? null;
    },
    // Flags rarely flip — cache aggressively.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) return { enabled: false, isLoading: true };
  if (!data || !data.is_enabled) return { enabled: false, isLoading: false };

  const bucket = bucketFor(user?.id, flagKey);
  return { enabled: bucket < (data.rollout_percentage ?? 0), isLoading: false };
}
