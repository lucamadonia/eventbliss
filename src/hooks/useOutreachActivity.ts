import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface OutreachActivityRow {
  id: string;
  directory_id: number;
  action: string;
  stage: string | null;
  details: Record<string, unknown> | null;
  performed_by: string | null;
  created_at: string;
}

export function useOutreachActivity(directoryId: number | undefined) {
  return useQuery({
    queryKey: ["outreach-activity", directoryId],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(
        "agency_outreach_activity"
      )
        .select("*")
        .eq("directory_id", directoryId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as OutreachActivityRow[];
    },
    enabled: !!directoryId,
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      directoryId,
      action,
      stage,
      details,
    }: {
      directoryId: number;
      action: string;
      stage?: string;
      details?: Record<string, unknown>;
    }) => {
      const { error } = await (supabase.from as any)(
        "agency_outreach_activity"
      ).insert({
        directory_id: directoryId,
        action,
        stage: stage || null,
        details: details || null,
        performed_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success("Aktivität protokolliert");
      qc.invalidateQueries({
        queryKey: ["outreach-activity", variables.directoryId],
      });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
