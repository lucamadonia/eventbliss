import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isManagedFlagKey, isSwitchedOff } from "@/lib/app-switches";

export interface VisibilityRow {
  key: string;
  is_enabled: boolean;
  rollout_percentage: number | null;
}

/** What is needed to create a kill-switch row on first use. */
export interface SwitchSpec {
  key: string;
  name: string;
  description: string;
}

const QUERY_KEY = ["admin", "visibility-flags"] as const;

/**
 * Every kill-switch row the visibility tab manages (areas, features, games),
 * plus optimistic show/hide. Rows are always written at full rollout: a part of
 * the app is either visible for everyone or hidden for everyone.
 */
export function useVisibilityFlags() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<VisibilityRow[]> => {
      // The table holds a few dozen rows at most; `isManagedFlagKey` is the one filter.
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, is_enabled, rollout_percentage");
      if (error) throw error;
      return ((data as VisibilityRow[] | null) ?? []).filter((row) => isManagedFlagKey(row.key));
    },
    staleTime: 0,
  });

  const rows = query.data;
  const hiddenKeys = useMemo(
    () => new Set((rows ?? []).filter((row) => isSwitchedOff(row)).map((row) => row.key)),
    [rows],
  );
  const isHidden = useCallback((key: string) => hiddenKeys.has(key), [hiddenKeys]);

  const mutation = useMutation({
    mutationFn: async ({ specs, hidden }: { specs: SwitchSpec[]; hidden: boolean }) => {
      const { error } = await supabase.from("feature_flags").upsert(
        specs.map((spec) => ({
          key: spec.key,
          name: spec.name,
          description: spec.description,
          is_enabled: hidden,
          rollout_percentage: 100,
        })),
        { onConflict: "key" },
      );
      if (error) throw error;
      // Same audit entry as FeatureFlagsTab.setAppArea (log_admin_action exists since
      // 20260416200000_admin_portal_extended.sql); a failed log never undoes the change.
      await supabase.rpc("log_admin_action", {
        p_action: "feature_flag.toggle",
        p_target_type: "feature_flag",
        p_metadata: specs.length === 1
          ? { key: specs[0].key, new_state: hidden }
          : { keys: specs.map((spec) => spec.key), new_state: hidden },
      });
    },
    onMutate: async ({ specs, hidden }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<VisibilityRow[]>(QUERY_KEY);
      const changed = new Set(specs.map((spec) => spec.key));
      qc.setQueryData<VisibilityRow[]>(QUERY_KEY, (current = []) => [
        ...current.filter((row) => !changed.has(row.key)),
        ...specs.map((spec) => ({ key: spec.key, is_enabled: hidden, rollout_percentage: 100 })),
      ]);
      return { previous };
    },
    onError: (error: Error, { specs }, context) => {
      // Put back only the switches of THIS change, so a second switch flipped in
      // the meantime keeps its own state.
      const changed = new Set(specs.map((spec) => spec.key));
      const before = (context?.previous ?? []).filter((row) => changed.has(row.key));
      qc.setQueryData<VisibilityRow[]>(QUERY_KEY, (current = []) => [
        ...current.filter((row) => !changed.has(row.key)),
        ...before,
      ]);
      toast.error(t("admin.visibility.saveError", "Nicht gespeichert: {{message}}", { message: error.message }));
    },
    onSettled: (_data, _error, { specs }) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
      // The admin's own app instance should see the change at once, not after 5 minutes.
      void qc.invalidateQueries({ queryKey: ["hidden-games"] });
      for (const spec of specs) void qc.invalidateQueries({ queryKey: ["feature-flag", spec.key] });
    },
  });

  const setHidden = useCallback(
    (specs: SwitchSpec[], hidden: boolean) => (specs.length ? mutation.mutateAsync({ specs, hidden }).then(() => true, () => false) : Promise.resolve(true)),
    [mutation],
  );

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    isHidden,
    hiddenKeys,
    setHidden,
    isSaving: mutation.isPending,
  };
}
