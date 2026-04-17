import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DirectoryAgencyCRM {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string;
  country_code: string;
  website: string;
  phone: string;
  description: string;
  status: string;
  outreach_status: string;
  outreach_campaign_id: string | null;
  last_outreach_at: string | null;
  invite_token: string | null;
  contact_person: string | null;
  contact_role: string | null;
  contact_phone: string | null;
  estimated_budget: string | null;
  agency_goals: string | null;
  agency_size: string | null;
  outreach_notes: string | null;
  last_response: string | null;
  last_response_at: string | null;
  response_sentiment: "positive" | "neutral" | "negative" | null;
  priority: "low" | "normal" | "high" | "urgent";
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useDirectoryAgency(id: number | undefined) {
  return useQuery({
    queryKey: ["directory-agency", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("agency_directory")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DirectoryAgencyCRM;
    },
    enabled: !!id,
  });
}

export function useUpdateDirectoryAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<DirectoryAgencyCRM>;
    }) => {
      const { error } = await (supabase.from as any)("agency_directory")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success("Agentur aktualisiert");
      qc.invalidateQueries({
        queryKey: ["directory-agency", variables.id],
      });
      qc.invalidateQueries({ queryKey: ["outreach-pipeline"] });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      note,
    }: {
      id: number;
      note: string;
    }) => {
      const { data: current, error: fetchErr } = await (supabase.from as any)(
        "agency_directory"
      )
        .select("outreach_notes")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const timestamp = new Date().toISOString();
      const existing = current?.outreach_notes || "";
      const appended = existing
        ? `${existing}\n\n[${timestamp}] ${note}`
        : `[${timestamp}] ${note}`;

      const { error: updateErr } = await (supabase.from as any)(
        "agency_directory"
      )
        .update({ outreach_notes: appended })
        .eq("id", id);
      if (updateErr) throw updateErr;

      const { error: actErr } = await (supabase.from as any)(
        "agency_outreach_activity"
      ).insert({
        directory_id: id,
        action: "note_added",
        details: { note },
        performed_by: user?.id || null,
      });
      if (actErr) throw actErr;
    },
    onSuccess: (_data, variables) => {
      toast.success("Notiz hinzugefügt");
      qc.invalidateQueries({
        queryKey: ["directory-agency", variables.id],
      });
      qc.invalidateQueries({
        queryKey: ["outreach-activity", variables.id],
      });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useLogResponse() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      response,
      sentiment,
    }: {
      id: number;
      response: string;
      sentiment: "positive" | "neutral" | "negative";
    }) => {
      const { error: updateErr } = await (supabase.from as any)(
        "agency_directory"
      )
        .update({
          last_response: response,
          last_response_at: new Date().toISOString(),
          response_sentiment: sentiment,
        })
        .eq("id", id);
      if (updateErr) throw updateErr;

      const { error: actErr } = await (supabase.from as any)(
        "agency_outreach_activity"
      ).insert({
        directory_id: id,
        action: "response_received",
        details: { response, sentiment },
        performed_by: user?.id || null,
      });
      if (actErr) throw actErr;
    },
    onSuccess: (_data, variables) => {
      toast.success("Antwort protokolliert");
      qc.invalidateQueries({
        queryKey: ["directory-agency", variables.id],
      });
      qc.invalidateQueries({
        queryKey: ["outreach-activity", variables.id],
      });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}

export function useUpdateTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      const { error } = await (supabase.from as any)("agency_directory")
        .update({ tags })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success("Tags aktualisiert");
      qc.invalidateQueries({
        queryKey: ["directory-agency", variables.id],
      });
    },
    onError: (e: Error) => toast.error(`Fehler: ${e.message}`),
  });
}
