/**
 * Der Blick des Influencers auf seine eigenen Daten — fuer das Portal unter
 * /influencer.
 *
 * UNTERSCHIED ZUM TOKEN-BEREICH: /creators/<token> liest ueber die Edge
 * Function, weil dort niemand angemeldet ist. Hier IST jemand angemeldet, und
 * die RLS-Regeln lassen genau seine Zeilen durch ("Influencer reads own …").
 * Deshalb kein Umweg ueber den Server: was er sehen darf, entscheidet die
 * Datenbank.
 *
 * ACHTUNG: Die RLS-Regel erlaubt die GANZE Zeile, auch `internal_notes`.
 * `useMyBriefing` waehlt die Felder deshalb ausdruecklich aus — dieselbe
 * Positivliste wie in der Edge Function.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const from = (table: string) => (supabase.from as any)(table);

export interface MyInfluencer {
  id: number;
  handle: string;
  display_name: string | null;
  email: string;
  platform: string;
  followers: number | null;
  language: string | null;
  invite_token: string | null;
  outreach_status: string;
}

/** Die eigene Zeile im Verzeichnis — oder null, wenn das Konto keine hat. */
export function useMyInfluencer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-influencer", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MyInfluencer | null> => {
      const { data, error } = await from("influencer_directory")
        .select("id, handle, display_name, email, platform, followers, language, invite_token, outreach_status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as MyInfluencer) ?? null;
    },
  });
}

export function useMyDeal(influencerId: number | undefined) {
  return useQuery({
    queryKey: ["my-influencer-deal", influencerId],
    enabled: !!influencerId,
    queryFn: async () => {
      const { data, error } = await from("influencer_deals")
        .select("*")
        .eq("influencer_id", influencerId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useMyTasks(influencerId: number | undefined) {
  return useQuery({
    queryKey: ["my-influencer-tasks", influencerId],
    enabled: !!influencerId,
    queryFn: async () => {
      const { data, error } = await from("influencer_deliverables")
        .select("*")
        .eq("influencer_id", influencerId)
        .order("due_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Nachweis einreichen.
 *
 * Die RLS-Regel laesst nur `status = 'submitted'` durch — freigeben kann der
 * Influencer sich also nicht, auch wenn er es versuchte.
 */
export function useSubmitProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, proofUrl }: { taskId: number; proofUrl: string }) => {
      if (!/^https?:\/\//i.test(proofUrl)) {
        throw new Error("Bitte einen vollständigen Link mit https:// angeben.");
      }
      const { error } = await from("influencer_deliverables")
        .update({ proof_url: proofUrl, status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Danke — wir schauen es uns an.");
      qc.invalidateQueries({ queryKey: ["my-influencer-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Das eigene Briefing — mit derselben Positivliste wie die Edge Function. */
export function useMyBriefing(influencerId: number | undefined) {
  return useQuery({
    queryKey: ["my-influencer-briefing", influencerId],
    enabled: !!influencerId,
    queryFn: async () => {
      const { data, error } = await from("influencer_briefings")
        .select(
          "headline, core_message, tone, dos, donts, mention_handles, hashtags, " +
          "link_url, discount_code, discount_note, disclosure_required, " +
          "disclosure_text, approval_required, publish_from, publish_until, extra",
        )
        .eq("influencer_id", influencerId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/** Das eigene Abo — fuer "Zugang laeuft bis …". */
export function useMySubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-influencer-subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await from("subscriptions")
        .select("plan, plan_type, provider, expires_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/* ── Bibel ───────────────────────────────────────────────────────────── */

export interface BibleChapter {
  id: number;
  slug: string;
  sort_order: number;
  title: string;
  summary: string | null;
  icon: string | null;
  pages: { id: number; sort_order: number; title: string; body: string }[];
}

export function useBible() {
  // Die Bibel gibt es zum Start auf Deutsch; die englische Fassung folgt als
  // weiterer Seed. Bis dahin ist Deutsch besser als eine leere Seite.
  const lang = "de";
  return useQuery({
    queryKey: ["influencer-bible", lang],
    queryFn: async (): Promise<BibleChapter[]> => {
      const { data, error } = await from("influencer_bible_chapters")
        .select("id, slug, sort_order, title, summary, icon, pages:influencer_bible_pages(id, sort_order, title, body)")
        .eq("language", lang)
        .eq("is_published", true)
        .order("sort_order");
      if (error) throw error;
      return ((data || []) as BibleChapter[]).map((c) => ({
        ...c,
        pages: [...(c.pages || [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
}

export function useBibleProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["influencer-bible-progress", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Set<number>> => {
      const { data, error } = await from("influencer_bible_progress")
        .select("page_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map((r: { page_id: number }) => r.page_id));
    },
  });
}

export function useMarkPageRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pageId: number) => {
      if (!user?.id) return;
      // Doppeltes Markieren ist kein Fehler — deshalb upsert statt insert.
      await from("influencer_bible_progress").upsert(
        { user_id: user.id, page_id: pageId },
        { onConflict: "user_id,page_id" },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["influencer-bible-progress"] }),
  });
}
