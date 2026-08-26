/**
 * Briefing, Materialien, Verlauf und Kontoverknuepfung eines Influencers.
 *
 * Bewusst getrennt von useInfluencers.ts: dort steht das Verzeichnis mit
 * Deals und Aufgaben, hier alles rund um die inhaltliche Zusammenarbeit. Zwei
 * Dateien mit je einem Thema statt einer mit 700 Zeilen.
 *
 * Wie im Nachbarmodul die Lockerung `(supabase.from as any)`: die generierten
 * Typen kennen diese Tabellen nicht, weil sie seit Monaten nicht neu erzeugt
 * wurden. Ohne sie laeuft die Typherleitung des Query-Builders in TS2589.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildTrialPatch } from "@/lib/subscription-plans";
import type { BriefingFields } from "@/lib/influencer-briefing";

const from = (table: string) => (supabase.from as any)(table);

const KEY_DIRECTORY = ["admin-influencers"];
const KEY_BRIEFING = ["admin-influencer-briefing"];
const KEY_TEMPLATES = ["admin-influencer-briefing-templates"];
const KEY_ASSETS = ["admin-influencer-assets"];
const KEY_ACTIVITY = ["admin-influencer-activity"];

/* ── Typen ───────────────────────────────────────────────────────────── */

export interface BriefingRow extends BriefingFields {
  id: number;
  influencer_id: number;
  template_id: number | null;
  updated_at: string;
}

export interface BriefingTemplate extends BriefingFields {
  id: number;
  name: string;
  group_id: number | null;
  package_id: number | null;
}

export interface BriefingAsset {
  id: number;
  influencer_id: number;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface ActivityRow {
  id: number;
  influencer_id: number;
  action: string;
  details: Record<string, unknown> | null;
  performed_by: string | null;
  created_at: string;
}

/* ── Verlauf ─────────────────────────────────────────────────────────── */

/**
 * Verlauf schreiben.
 *
 * Bewusst OHNE Fehler nach aussen: ein Protokolleintrag, der scheitert, darf
 * die eigentliche Handlung nicht abbrechen. Ein fehlender Eintrag ist
 * aergerlich, eine abgebrochene Statusaenderung ist schlimmer.
 */
export async function logInfluencerActivity(
  influencerId: number,
  action: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await from("influencer_activity").insert({
      influencer_id: influencerId,
      action,
      details,
      performed_by: userData.user?.id ?? null,
    });
  } catch (e) {
    console.warn("activity log failed", e);
  }
}

export function useInfluencerActivity(influencerId: number | undefined) {
  return useQuery({
    queryKey: [...KEY_ACTIVITY, influencerId],
    enabled: !!influencerId,
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await from("influencer_activity")
        .select("*")
        .eq("influencer_id", influencerId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as ActivityRow[];
    },
  });
}

export function useAddActivityNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ influencerId, kind, text }: { influencerId: number; kind: string; text: string }) => {
      await logInfluencerActivity(influencerId, "note", { kind, text });
    },
    onSuccess: (_d, v) => {
      toast.success("Vermerk gespeichert");
      qc.invalidateQueries({ queryKey: [...KEY_ACTIVITY, v.influencerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Briefing ────────────────────────────────────────────────────────── */

export function useBriefing(influencerId: number | undefined) {
  return useQuery({
    queryKey: [...KEY_BRIEFING, influencerId],
    enabled: !!influencerId,
    queryFn: async (): Promise<BriefingRow | null> => {
      const { data, error } = await from("influencer_briefings")
        .select("*")
        .eq("influencer_id", influencerId)
        .maybeSingle();
      if (error) throw error;
      return (data as BriefingRow) ?? null;
    },
  });
}

export function useSaveBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ influencerId, fields, templateId }: {
      influencerId: number;
      fields: BriefingFields;
      templateId?: number | null;
    }) => {
      const { error } = await from("influencer_briefings").upsert(
        { influencer_id: influencerId, template_id: templateId ?? null, ...fields },
        { onConflict: "influencer_id" },
      );
      if (error) throw error;
      await logInfluencerActivity(influencerId, "briefing_saved", { headline: fields.headline });
    },
    onSuccess: (_d, v) => {
      toast.success("Briefing gespeichert");
      qc.invalidateQueries({ queryKey: [...KEY_BRIEFING, v.influencerId] });
      qc.invalidateQueries({ queryKey: [...KEY_ACTIVITY, v.influencerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBriefingTemplates() {
  return useQuery({
    queryKey: KEY_TEMPLATES,
    queryFn: async (): Promise<BriefingTemplate[]> => {
      const { data, error } = await from("influencer_briefing_templates").select("*").order("name");
      if (error) throw error;
      return (data || []) as BriefingTemplate[];
    },
  });
}

export function useSaveBriefingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tpl: Partial<BriefingTemplate> & { name: string }) => {
      const { error } = tpl.id
        ? await from("influencer_briefing_templates").update(tpl).eq("id", tpl.id)
        : await from("influencer_briefing_templates").insert(tpl);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vorlage gespeichert");
      qc.invalidateQueries({ queryKey: KEY_TEMPLATES });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Materialien ─────────────────────────────────────────────────────── */

export function useBriefingAssets(influencerId: number | undefined) {
  return useQuery({
    queryKey: [...KEY_ASSETS, influencerId],
    enabled: !!influencerId,
    queryFn: async (): Promise<BriefingAsset[]> => {
      const { data, error } = await from("influencer_briefing_assets")
        .select("*")
        .eq("influencer_id", influencerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BriefingAsset[];
    },
  });
}

export function useUploadAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ influencerId, file }: { influencerId: number; file: File }) => {
      // Der Pfad traegt die Influencer-Kennung, damit Dateien beim Aufraeumen
      // zuzuordnen sind, und einen Zeitstempel gegen Namenskollisionen.
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${influencerId}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from("influencer-assets").upload(path, file);
      if (upErr) throw upErr;

      const { data: userData } = await supabase.auth.getUser();
      const { error } = await from("influencer_briefing_assets").insert({
        influencer_id: influencerId,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: userData.user?.id ?? null,
      });
      if (error) throw error;
      await logInfluencerActivity(influencerId, "asset_added", { file: file.name });
    },
    onSuccess: (_d, v) => {
      toast.success("Datei hochgeladen");
      qc.invalidateQueries({ queryKey: [...KEY_ASSETS, v.influencerId] });
      qc.invalidateQueries({ queryKey: [...KEY_ACTIVITY, v.influencerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: BriefingAsset) => {
      await supabase.storage.from("influencer-assets").remove([asset.storage_path]);
      const { error } = await from("influencer_briefing_assets").delete().eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: (_d, a) => qc.invalidateQueries({ queryKey: [...KEY_ASSETS, a.influencer_id] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Zeitlich begrenzter Link — der Bucket ist privat, es gibt keine feste URL. */
export async function signedAssetUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("influencer-assets").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

/* ── Konto ───────────────────────────────────────────────────────────── */

export interface LinkableProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

export function useLinkableProfiles(search: string) {
  return useQuery({
    queryKey: ["admin-linkable-profiles", search],
    queryFn: async (): Promise<LinkableProfile[]> => {
      let q = from("profiles").select("id, email, full_name").limit(20);
      if (search.trim()) q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as LinkableProfile[];
    },
  });
}

export function useLinkUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ influencerId, userId, alsoRole }: {
      influencerId: number;
      userId: string | null;
      alsoRole?: boolean;
    }) => {
      const { error } = await from("influencer_directory")
        .update({ user_id: userId })
        .eq("id", influencerId);
      if (error) throw error;

      // Die Rolle gibt KEIN Premium — das kommt aus dem Abo. Sie ist nur der
      // spaetere Portal-Schluessel, deshalb ein eigenes Haekchen.
      if (userId && alsoRole) {
        const { error: roleError } = await from("user_roles")
          .insert({ user_id: userId, role: "influencer" });
        // Eine bereits vorhandene Rolle ist kein Fehler, den jemand sehen muss.
        if (roleError && !/duplicate|unique/i.test(roleError.message)) {
          console.warn("role insert failed", roleError.message);
        }
      }

      await logInfluencerActivity(
        influencerId,
        userId ? "account_linked" : "account_unlinked",
        { userId },
      );
    },
    onSuccess: (_d, v) => {
      toast.success(v.userId ? "Konto verknüpft" : "Verknüpfung gelöst");
      qc.invalidateQueries({ queryKey: KEY_DIRECTORY });
      qc.invalidateQueries({ queryKey: [...KEY_ACTIVITY, v.influencerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Das Abo des verknuepften Kontos — fuer die Anzeige im Konto-Block. */
export function useLinkedSubscription(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["admin-influencer-linked-sub", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/**
 * Abo DIREKT vergeben — nur mit verknuepftem Konto.
 *
 * Ohne Konto geht das nicht: ein Abo braucht eine user_id. Genau dafuer gibt
 * es den Gutscheincode. Mit Konto waere der Code ein Umweg, den niemand gehen
 * muss.
 */
export function useGrantTrialToLinkedUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ influencerId, userId, months, unlimited }: {
      influencerId: number;
      userId: string;
      months: number;
      unlimited?: boolean;
    }) => {
      const patch = unlimited
        ? {
            plan: "premium",
            plan_type: null,
            provider: "manual",
            is_manual: true,
            expires_at: null,
            notes: "Influencer — Premium unbegrenzt",
          }
        : { ...buildTrialPatch(months), notes: `Influencer — Probe ${months} Monate` };

      const { data: existing } = await from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const { error } = existing
        ? await from("subscriptions").update(patch).eq("id", existing.id)
        : await from("subscriptions").insert({ user_id: userId, ...patch });
      if (error) throw error;

      await logInfluencerActivity(influencerId, "subscription_granted", {
        months: unlimited ? null : months,
        unlimited: !!unlimited,
      });
    },
    onSuccess: (_d, v) => {
      toast.success(v.unlimited ? "Premium unbegrenzt vergeben" : `Probe-Abo über ${v.months} Monate vergeben`);
      qc.invalidateQueries({ queryKey: ["admin-influencer-linked-sub", v.userId] });
      qc.invalidateQueries({ queryKey: [...KEY_ACTIVITY, v.influencerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
