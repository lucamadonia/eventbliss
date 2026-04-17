import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useOutreachPipeline() {
  const { data, isLoading } = useQuery({
    queryKey: ["outreach-pipeline"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_directory")
        .select("outreach_status");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const status = row.outreach_status || "none";
        counts[status] = (counts[status] || 0) + 1;
      }
      return counts;
    },
  });

  return { counts: data || {}, isLoading };
}

export function useOutreachQueue(campaignId?: string) {
  return useQuery({
    queryKey: ["outreach-queue", campaignId],
    queryFn: async () => {
      let query = (supabase.from as any)("agency_outreach_queue")
        .select("*, agency_directory(name, email, city)")
        .order("scheduled_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      directoryIds,
      newStatus,
    }: {
      directoryIds: number[];
      newStatus: string;
    }) => {
      const { error } = await (supabase.from as any)("agency_directory")
        .update({ outreach_status: newStatus })
        .in("id", directoryIds);
      if (error) throw error;

      const activityRows = directoryIds.map((dirId) => ({
        directory_id: dirId,
        action: "status_changed",
        details: { new_status: newStatus },
        performed_by: user?.id || null,
      }));

      const { error: actErr } = await (supabase.from as any)(
        "agency_outreach_activity"
      ).insert(activityRows);
      if (actErr) throw actErr;
    },
    onSuccess: () => {
      toast.success("Status aktualisiert");
      qc.invalidateQueries({ queryKey: ["outreach-pipeline"] });
      qc.invalidateQueries({ queryKey: ["agency-directory"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useAddToCampaign() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      directoryIds,
      campaignId,
    }: {
      directoryIds: number[];
      campaignId: string;
    }) => {
      const queueRows = directoryIds.map((dirId) => ({
        directory_id: dirId,
        campaign_id: campaignId,
        stage: "stage_1",
        scheduled_at: new Date().toISOString(),
      }));

      const { error: queueErr } = await (supabase.from as any)(
        "agency_outreach_queue"
      ).insert(queueRows);
      if (queueErr) throw queueErr;

      const { error: dirErr } = await (supabase.from as any)(
        "agency_directory"
      )
        .update({ outreach_campaign_id: campaignId })
        .in("id", directoryIds);
      if (dirErr) throw dirErr;
    },
    onSuccess: () => {
      toast.success("Zur Kampagne hinzugefügt");
      qc.invalidateQueries({ queryKey: ["outreach-queue"] });
      qc.invalidateQueries({ queryKey: ["outreach-pipeline"] });
      qc.invalidateQueries({ queryKey: ["agency-directory"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
