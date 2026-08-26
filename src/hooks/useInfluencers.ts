/**
 * Datenzugriff fuer das Influencer-Verzeichnis.
 *
 * Aufgebaut wie die Outreach-Hooks der Agentur-Akquise
 * (src/hooks/useOutreachAgencyCRM.ts), inklusive der dortigen Lockerung
 * `(supabase.from as any)`: die generierten Typen in
 * src/integrations/supabase/types.ts kennen die neuen Tabellen nicht, weil sie
 * seit Monaten nicht neu erzeugt wurden. Ohne die Lockerung laeuft die
 * Typherleitung des Query-Builders in TS2589.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InfluencerPlatform, InfluencerPriority, InfluencerStatus } from "@/lib/influencer-status";

export interface Influencer {
  id: number;
  handle: string;
  display_name: string | null;
  email: string;
  platform: InfluencerPlatform;
  profile_url: string | null;
  country_code: string | null;
  language: string | null;
  followers: number | null;
  avg_views: number | null;
  engagement_rate: number | null;
  niche: string[] | null;
  group_id: number | null;
  outreach_status: InfluencerStatus;
  last_outreach_at: string | null;
  last_response: string | null;
  last_response_at: string | null;
  response_sentiment: "positive" | "neutral" | "negative" | null;
  priority: InfluencerPriority;
  tags: string[] | null;
  user_id: string | null;
  affiliate_id: string | null;
  invite_token: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const KEY = ["admin-influencers"];

export function useInfluencers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Influencer[]> => {
      const { data, error } = await (supabase.from as any)("influencer_directory")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Influencer[];
    },
  });
}

export function useUpdateInfluencer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Influencer> }) => {
      const { error } = await (supabase.from as any)("influencer_directory")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateInfluencer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<Influencer>) => {
      const { error } = await (supabase.from as any)("influencer_directory").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Influencer angelegt");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Mehrere auf einmal — aus einer CSV.
 *
 * `upsert` auf die E-Mail statt `insert`: eine Liste, die zum zweiten Mal
 * eingelesen wird, soll den Bestand aktualisieren und nicht an der
 * Eindeutigkeit scheitern. Ein abgebrochener Import, der die Haelfte drin
 * laesst, ist schlimmer als einer, der zweimal laeuft.
 */
export function useImportInfluencers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Partial<Influencer>[]) => {
      if (rows.length === 0) throw new Error("Keine Zeilen erkannt.");
      const { error } = await (supabase.from as any)("influencer_directory")
        .upsert(rows, { onConflict: "email" });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} Influencer eingelesen`);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface GrantTrialArgs {
  influencer: Influencer;
  months: number;
  /** true = Premium ohne Ablauf statt Probe. */
  unlimited?: boolean;
}

/**
 * Probe-Abo vergeben — als persoenlicher Gutscheincode.
 *
 * WARUM NICHT DIREKT IN `subscriptions`: ein Influencer hat zu diesem
 * Zeitpunkt in aller Regel noch gar kein Konto. Ein Abo braucht aber eine
 * `user_id`. Der Code loest das: er wird verschickt, der Influencer meldet
 * sich an und loest ihn ein — `redeem-voucher` legt das Abo dann mit dem
 * richtigen Ablaufdatum an.
 *
 * `discount_value` ist in TAGEN, nicht in Monaten — so rechnet
 * redeem-voucher. Monate mal 30 ist bewusst grob: der Code hat ohnehin ein
 * eigenes Verfallsdatum, und ein Tag mehr oder weniger entscheidet hier
 * nichts.
 */
export function useGrantInfluencerTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ influencer, months, unlimited }: GrantTrialArgs) => {
      const slug = influencer.handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "INF";
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const code = `INF-${slug}-${suffix}`;

      const { data: userData } = await supabase.auth.getUser();
      const validUntil = new Date();
      // Der Code selbst laeuft nach 60 Tagen ab. Nicht der Zugang — nur die
      // Moeglichkeit, ihn einzuloesen. Sonst liegen Codes ewig herum.
      validUntil.setDate(validUntil.getDate() + 60);

      const { data: voucher, error } = await (supabase.from as any)("vouchers")
        .insert({
          code,
          discount_type: unlimited ? "lifetime" : "free_trial",
          discount_value: unlimited ? null : months * 30,
          max_uses: 1,
          valid_until: validUntil.toISOString(),
          created_by: userData.user?.id ?? null,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;

      return { code, voucherId: voucher.id as string };
    },
    onSuccess: async ({ code }, { influencer }) => {
      await (supabase.from as any)("influencer_directory")
        .update({
          notes: [influencer.notes, `Code ${code} vergeben`].filter(Boolean).join("\n"),
        })
        .eq("id", influencer.id);
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
      toast.success(`Code ${code} angelegt`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
