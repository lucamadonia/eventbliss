import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hiddenGameIds } from "@/lib/app-switches";

const NONE: ReadonlySet<string> = new Set<string>();

export interface HiddenGamesState {
  /** Ids of the hidden games; empty while loading and after a failed request. */
  hidden: ReadonlySet<string>;
  /** The server has answered (or failed for good), so `hidden` is no longer a placeholder. */
  settled: boolean;
}

/**
 * Games an admin has hidden (`game_<id>_off` rows in `feature_flags`), read in
 * ONE query for the whole games catalogue. Same cache lifetime as
 * `useFeatureFlag`, so a change reaches open apps within five minutes. Fails
 * open: while loading, or when the request fails, no game is hidden.
 */
export function useHiddenGamesState(): HiddenGamesState {
  const { data, isPending } = useQuery({
    queryKey: ["hidden-games"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("feature_flags")
        .select("key, is_enabled, rollout_percentage")
        // `_` is a LIKE wildcard, so this may over-match; `hiddenGameIds` is the exact filter.
        .like("key", "game_%_off");
      if (error) throw error; // not cached as "nothing hidden": React Query retries
      return rows ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
  const hidden = useMemo(() => (data ? hiddenGameIds(data) : NONE), [data]);
  return useMemo(() => ({ hidden, settled: !isPending }), [hidden, isPending]);
}

/** Just the ids, for lists that only filter. */
export function useHiddenGames(): ReadonlySet<string> {
  return useHiddenGamesState().hidden;
}
