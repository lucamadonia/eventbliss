import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OutreachCampaign {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  sender_email: string;
  sender_name: string;
  drip_rate: number;
  template_stage1_subject: string;
  template_stage1_body: string;
  template_stage2_subject: string | null;
  template_stage2_body: string | null;
  template_stage3_subject: string | null;
  template_stage3_body: string | null;
  target_filter: Record<string, unknown>;
  stats_contacted: number;
  stats_responded: number;
  stats_converted: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useOutreachCampaigns() {
  return useQuery({
    queryKey: ["outreach-campaigns"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(
        "agency_outreach_campaigns"
      )
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as OutreachCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      campaign: Omit<
        OutreachCampaign,
        | "id"
        | "created_at"
        | "updated_at"
        | "stats_contacted"
        | "stats_responded"
        | "stats_converted"
      >
    ) => {
      const { data, error } = await (supabase.from as any)(
        "agency_outreach_campaigns"
      )
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data as OutreachCampaign;
    },
    onSuccess: () => {
      toast.success("Kampagne erstellt");
      qc.invalidateQueries({ queryKey: ["outreach-campaigns"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      status?: OutreachCampaign["status"];
      templates?: {
        template_stage1_subject?: string;
        template_stage1_body?: string;
        template_stage2_subject?: string | null;
        template_stage2_body?: string | null;
        template_stage3_subject?: string | null;
        template_stage3_body?: string | null;
      };
      drip_rate?: number;
      sender_email?: string;
      sender_name?: string;
      target_filter?: Record<string, unknown>;
    }) => {
      const { templates, ...rest } = updates;
      const payload = { ...rest, ...templates };
      const { error } = await (supabase.from as any)(
        "agency_outreach_campaigns"
      )
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kampagne aktualisiert");
      qc.invalidateQueries({ queryKey: ["outreach-campaigns"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(
        "agency_outreach_campaigns"
      )
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kampagne gelöscht");
      qc.invalidateQueries({ queryKey: ["outreach-campaigns"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
