/**
 * Datenzugriff fuer das Influencer-Programm.
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
import { addMonths, buildTrialPatch } from "@/lib/subscription-plans";
import type {
  InfluencerPlatform, InfluencerPriority, InfluencerReward, InfluencerStatus,
} from "@/lib/influencer-status";

/* ── Typen ───────────────────────────────────────────────────────────── */

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

export interface InfluencerGroup {
  id: number;
  name: string;
  description: string | null;
  default_trial_months: number | null;
  default_commission_rate: number | null;
  default_fee_amount: number | null;
  default_package_id: number | null;
}

export interface InfluencerPackage {
  id: number;
  name: string;
  description: string | null;
  duration_days: number;
  is_active: boolean;
}

export interface PackageItem {
  id: number;
  package_id: number;
  kind: string;
  quantity: number;
  due_offset_days: number;
  requirements: string | null;
  sort_order: number;
}

export interface InfluencerDeal {
  id: number;
  influencer_id: number;
  reward_kinds: InfluencerReward[];
  trial_months: number | null;
  unlimited: boolean;
  commission_rate: number | null;
  fee_amount: number | null;
  fee_currency: string | null;
  fee_status: "open" | "invoiced" | "paid" | null;
  voucher_id: string | null;
  package_id: number | null;
  starts_at: string | null;
  ends_at: string | null;
  status: "draft" | "active" | "fulfilled" | "cancelled";
  agreed_at: string | null;
  notes: string | null;
}

export interface Deliverable {
  id: number;
  influencer_id: number;
  deal_id: number | null;
  kind: string;
  title: string;
  due_at: string | null;
  status: "open" | "submitted" | "approved" | "rejected" | "overdue" | "waived";
  proof_url: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  notes: string | null;
}

const KEY = ["admin-influencers"];
const KEY_GROUPS = ["admin-influencer-groups"];
const KEY_PACKAGES = ["admin-influencer-packages"];
const KEY_DEALS = ["admin-influencer-deals"];
const KEY_DELIVERABLES = ["admin-influencer-deliverables"];

const from = (table: string) => (supabase.from as any)(table);

/* ── Verzeichnis ─────────────────────────────────────────────────────── */

export function useInfluencers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Influencer[]> => {
      const { data, error } = await from("influencer_directory")
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
      const { error } = await from("influencer_directory").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateInfluencer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<Influencer>) => {
      const { error } = await from("influencer_directory").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Influencer angelegt");
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteInfluencer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await from("influencer_directory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Influencer entfernt");
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
      const { error } = await from("influencer_directory").upsert(rows, { onConflict: "email" });
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

/* ── Gruppen und Pakete ──────────────────────────────────────────────── */

export function useInfluencerGroups() {
  return useQuery({
    queryKey: KEY_GROUPS,
    queryFn: async (): Promise<InfluencerGroup[]> => {
      const { data, error } = await from("influencer_groups").select("*").order("name");
      if (error) throw error;
      return (data || []) as InfluencerGroup[];
    },
  });
}

export function useSaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (group: Partial<InfluencerGroup>) => {
      const { error } = group.id
        ? await from("influencer_groups").update(group).eq("id", group.id)
        : await from("influencer_groups").insert(group);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gruppe gespeichert");
      qc.invalidateQueries({ queryKey: KEY_GROUPS });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInfluencerPackages() {
  return useQuery({
    queryKey: KEY_PACKAGES,
    queryFn: async (): Promise<(InfluencerPackage & { items: PackageItem[] })[]> => {
      const { data, error } = await from("influencer_packages")
        .select("*, items:influencer_package_items(*)")
        .order("name");
      if (error) throw error;
      return (data || []) as (InfluencerPackage & { items: PackageItem[] })[];
    },
  });
}

export function useSavePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pkg, items }: { pkg: Partial<InfluencerPackage>; items: Partial<PackageItem>[] }) => {
      let packageId = pkg.id;
      if (packageId) {
        const { error } = await from("influencer_packages").update(pkg).eq("id", packageId);
        if (error) throw error;
        // Posten werden ersetzt, nicht abgeglichen: ein Paket hat eine
        // Handvoll Zeilen, und ein Abgleich waere mehr Code als Nutzen.
        await from("influencer_package_items").delete().eq("package_id", packageId);
      } else {
        const { data, error } = await from("influencer_packages").insert(pkg).select().single();
        if (error) throw error;
        packageId = data.id as number;
      }
      if (items.length) {
        const { error } = await from("influencer_package_items")
          .insert(items.map((it, i) => ({ ...it, package_id: packageId, sort_order: i })));
        if (error) throw error;
      }
      return packageId;
    },
    onSuccess: () => {
      toast.success("Paket gespeichert");
      qc.invalidateQueries({ queryKey: KEY_PACKAGES });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ── Deals und Aufgaben ──────────────────────────────────────────────── */

export function useInfluencerDeals(influencerId?: number) {
  return useQuery({
    queryKey: [...KEY_DEALS, influencerId ?? "all"],
    queryFn: async (): Promise<InfluencerDeal[]> => {
      let q = from("influencer_deals").select("*").order("created_at", { ascending: false });
      if (influencerId) q = q.eq("influencer_id", influencerId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as InfluencerDeal[];
    },
  });
}

export function useDeliverables(influencerId?: number) {
  return useQuery({
    queryKey: [...KEY_DELIVERABLES, influencerId ?? "all"],
    queryFn: async (): Promise<Deliverable[]> => {
      let q = from("influencer_deliverables").select("*").order("due_at", { ascending: true });
      if (influencerId) q = q.eq("influencer_id", influencerId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Deliverable[];
    },
  });
}

export function useUpdateDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Deliverable> }) => {
      const { error } = await from("influencer_deliverables").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_DELIVERABLES });
      qc.invalidateQueries({ queryKey: KEY_DELIVERABLES.concat("all") });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ActivateDealArgs {
  influencer: Influencer;
  rewardKinds: InfluencerReward[];
  trialMonths: number | null;
  unlimited: boolean;
  commissionRate: number | null;
  feeAmount: number | null;
  packageId: number | null;
  packageItems: PackageItem[];
  notes: string;
}

/**
 * Die Zusage in Wirklichkeit uebersetzen — ein Knopf, vier Schritte.
 *
 * 1. Gutschein, falls es Zugang geben soll. WARUM EIN CODE UND KEIN DIREKTER
 *    ABO-EINTRAG: der Influencer hat zu diesem Zeitpunkt meist noch gar kein
 *    Konto, ein Abo braucht aber eine user_id. `discount_value` ist in TAGEN —
 *    so rechnet redeem-voucher.
 * 2. Der Deal selbst, mit allem, was vereinbart wurde.
 * 3. Die Aufgaben aus dem Paket, mit Faelligkeit ab heute.
 * 4. Status auf "accepted".
 *
 * Was scheitert, wird gemeldet statt verschluckt: ein Teilerfolg, der sich als
 * voller Erfolg meldet, ist schlimmer als ein Fehler. Dieselbe Regel wie in
 * der Edge Function create-user.
 */
export function useActivateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: ActivateDealArgs) => {
      const warnings: string[] = [];
      const now = new Date();
      let voucherId: string | null = null;
      let code: string | null = null;

      const wantsAccess = a.rewardKinds.includes("trial") || a.rewardKinds.includes("unlimited");

      /*
        IST EIN KONTO VERKNUEPFT, BRAUCHT ES KEINEN CODE.

        Der Gutschein loest ein Problem, das es nur ohne Konto gibt: ein Abo
        braucht eine user_id. Ist die da, war der Code bisher ein Umweg — der
        Admin sagte zu, der Influencer musste trotzdem erst einen Code
        eintippen, und bis dahin hatte er nichts.
      */
      if (wantsAccess && a.influencer.user_id) {
        const patch = a.unlimited
          ? {
              plan: "premium",
              plan_type: null,
              provider: "manual",
              is_manual: true,
              expires_at: null,
              notes: "Influencer — Premium unbegrenzt (Deal)",
            }
          : {
              ...buildTrialPatch(a.trialMonths ?? 3),
              notes: `Influencer — Probe ${a.trialMonths ?? 3} Monate (Deal)`,
            };

        const { data: existing } = await from("subscriptions")
          .select("id")
          .eq("user_id", a.influencer.user_id)
          .maybeSingle();

        const { error: subError } = existing
          ? await from("subscriptions").update(patch).eq("id", existing.id)
          : await from("subscriptions").insert({ user_id: a.influencer.user_id, ...patch });

        if (subError) warnings.push(`Abo: ${subError.message}`);
      } else if (wantsAccess) {
        const slug = a.influencer.handle.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "INF";
        code = `INF-${slug}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { data: userData } = await supabase.auth.getUser();
        const validUntil = new Date(now);
        // Nur die Einloesefrist des Codes, nicht die Laufzeit des Zugangs.
        validUntil.setDate(validUntil.getDate() + 60);

        const { data: voucher, error } = await from("vouchers")
          .insert({
            code,
            discount_type: a.unlimited ? "lifetime" : "free_trial",
            discount_value: a.unlimited ? null : (a.trialMonths ?? 3) * 30,
            max_uses: 1,
            valid_until: validUntil.toISOString(),
            created_by: userData.user?.id ?? null,
            is_active: true,
          })
          .select()
          .single();
        if (error) warnings.push(`Gutschein: ${error.message}`);
        else voucherId = voucher.id as string;
      }

      const endsAt = a.unlimited
        ? null
        : a.trialMonths
          ? addMonths(now, a.trialMonths).toISOString()
          : null;

      const { data: deal, error: dealError } = await from("influencer_deals")
        .insert({
          influencer_id: a.influencer.id,
          reward_kinds: a.rewardKinds,
          trial_months: a.trialMonths,
          unlimited: a.unlimited,
          commission_rate: a.commissionRate,
          fee_amount: a.feeAmount,
          voucher_id: voucherId,
          package_id: a.packageId,
          starts_at: now.toISOString(),
          ends_at: endsAt,
          status: "active",
          agreed_at: now.toISOString(),
          notes: a.notes || null,
        })
        .select()
        .single();
      if (dealError) throw dealError;

      if (a.packageItems.length) {
        const rows = a.packageItems.flatMap((item) =>
          Array.from({ length: item.quantity }, (_, n) => {
            const due = new Date(now);
            due.setDate(due.getDate() + item.due_offset_days);
            return {
              influencer_id: a.influencer.id,
              deal_id: deal.id,
              kind: item.kind,
              title: item.quantity > 1 ? `${item.kind} ${n + 1}/${item.quantity}` : item.kind,
              due_at: due.toISOString(),
              status: "open",
              notes: item.requirements || null,
            };
          }),
        );
        const { error } = await from("influencer_deliverables").insert(rows);
        if (error) warnings.push(`Aufgaben: ${error.message}`);
      }

      await from("influencer_directory")
        .update({ outreach_status: "accepted" })
        .eq("id", a.influencer.id);

      return { code, warnings };
    },
    onSuccess: ({ code, warnings }, a) => {
      if (warnings.length) toast.warning(`Deal aktiviert — ${warnings.join(" · ")}`);
      else if (code) toast.success(`Deal aktiviert, Code ${code}`);
      else if (a.influencer.user_id) toast.success("Deal aktiviert — Zugang direkt gesetzt, kein Code nötig");
      else toast.success("Deal aktiviert");
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: KEY_DEALS });
      qc.invalidateQueries({ queryKey: KEY_DELIVERABLES });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
