import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarToken {
  id: string;
  agency_id: string;
  guide_id: string | null;
  token: string;
  scope: "all" | "confirmed_only" | "guide_personal";
  is_active: boolean;
  last_accessed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// URL Builders
// ---------------------------------------------------------------------------

const SUPABASE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function getICalFeedUrl(token: string): string {
  return `${SUPABASE_FUNCTIONS_BASE}/ical-feed?token=${token}`;
}

export function getWebcalUrl(token: string): string {
  const httpUrl = getICalFeedUrl(token);
  return httpUrl.replace(/^https?:\/\//, "webcal://");
}

export function getOutlookSubscribeUrl(token: string): string {
  const webcalUrl = getWebcalUrl(token);
  return `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(webcalUrl)}`;
}

export function getGoogleCalendarUrl(token: string): string {
  const webcalUrl = getWebcalUrl(token);
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCalendarTokens(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["calendar-tokens", agencyId],
    queryFn: async (): Promise<CalendarToken[]> => {
      if (!agencyId) return [];

      const { data, error } = await supabase
        .from("calendar_tokens" as string)
        .select("*")
        .eq("agency_id", agencyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as CalendarToken[]) || [];
    },
    enabled: !!agencyId,
  });
}

export function useCreateCalendarToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      guideId,
      scope,
    }: {
      agencyId: string;
      guideId?: string;
      scope?: "all" | "confirmed_only" | "guide_personal";
    }) => {
      const { data, error } = await supabase
        .from("calendar_tokens" as string)
        .insert({
          agency_id: agencyId,
          guide_id: guideId || null,
          scope: scope || "all",
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CalendarToken;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-tokens", variables.agencyId],
      });
      toast.success("Kalender-Token erstellt");
    },
    onError: (error: Error) => {
      toast.error("Fehler beim Erstellen des Tokens: " + error.message);
    },
  });
}

export function useRevokeCalendarToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tokenId,
      agencyId,
    }: {
      tokenId: string;
      agencyId: string;
    }) => {
      const { error } = await supabase
        .from("calendar_tokens" as string)
        .update({ is_active: false })
        .eq("id", tokenId);

      if (error) throw error;
      return { tokenId, agencyId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-tokens", variables.agencyId],
      });
      toast.success("Token deaktiviert");
    },
    onError: (error: Error) => {
      toast.error("Fehler: " + error.message);
    },
  });
}

export function useRegenerateCalendarToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tokenId,
      agencyId,
      guideId,
      scope,
    }: {
      tokenId: string;
      agencyId: string;
      guideId?: string;
      scope?: "all" | "confirmed_only" | "guide_personal";
    }) => {
      // Deactivate old token
      await supabase
        .from("calendar_tokens" as string)
        .update({ is_active: false })
        .eq("id", tokenId);

      // Create new token
      const { data, error } = await supabase
        .from("calendar_tokens" as string)
        .insert({
          agency_id: agencyId,
          guide_id: guideId || null,
          scope: scope || "all",
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CalendarToken;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-tokens", variables.agencyId],
      });
      toast.success("Token erneuert — alter Token ist ungueltig");
    },
    onError: (error: Error) => {
      toast.error("Fehler: " + error.message);
    },
  });
}
