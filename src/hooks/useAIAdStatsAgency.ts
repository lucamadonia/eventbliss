import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AIAdOverview {
  impressions: number;
  clicks: number;
  ctr: number;
  attributedBookings: number;
  attributedRevenueCents: number;
}

export interface AIAdTopService {
  service_id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AIAdFeedRow {
  created_at: string;
  request_type: string | null;
  section_title: string | null;
  city_hint: string | null;
  event_type_hint: string | null;
}

export interface AIAdKeyword {
  keyword: string;
  count: number;
}

export interface UseAIAdStatsAgencyResult {
  overview: UseQueryResult<AIAdOverview, Error>;
  topServices: UseQueryResult<AIAdTopService[], Error>;
  recentFeed: UseQueryResult<AIAdFeedRow[], Error>;
  topKeywords: UseQueryResult<AIAdKeyword[], Error>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function rangeIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAIAdStatsAgency(rangeDays = 30): UseAIAdStatsAgencyResult {
  const { agency } = useAgency();
  const agencyId = agency?.id ?? null;
  const since = rangeIso(rangeDays);

  /* ---------- overview ---------- */
  const overview = useQuery<AIAdOverview, Error>({
    queryKey: ["ai-ad-overview", agencyId, rangeDays],
    enabled: !!agencyId,
    queryFn: async (): Promise<AIAdOverview> => {
      const { data, error } = await (supabase.from as any)("marketplace_ai_events")
        .select("event_type, service_id")
        .eq("agency_id", agencyId)
        .gte("created_at", since);

      if (error) throw error;
      const rows = (data ?? []) as Array<{ event_type: string; service_id: string | null }>;

      const impressions = rows.filter((r) => r.event_type === "impression").length;
      const clicks = rows.filter((r) => r.event_type === "click").length;
      const bookings = rows.filter((r) => r.event_type === "booking").length;

      // Attributed revenue: sum from booking rows
      let revenueCents = 0;
      if (bookings > 0) {
        const { data: bookingRows } = await (supabase.from as any)("marketplace_ai_events")
          .select("metadata")
          .eq("agency_id", agencyId)
          .eq("event_type", "booking")
          .gte("created_at", since);
        for (const br of (bookingRows ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
          const cents = Number(br.metadata?.revenue_cents ?? 0);
          if (!Number.isNaN(cents)) revenueCents += cents;
        }
      }

      return {
        impressions,
        clicks,
        ctr: impressions > 0 ? clicks / impressions : 0,
        attributedBookings: bookings,
        attributedRevenueCents: revenueCents,
      };
    },
  });

  /* ---------- topServices ---------- */
  const topServices = useQuery<AIAdTopService[], Error>({
    queryKey: ["ai-ad-top-services", agencyId, rangeDays],
    enabled: !!agencyId,
    queryFn: async (): Promise<AIAdTopService[]> => {
      const { data, error } = await (supabase.from as any)("marketplace_ai_events")
        .select("service_id, event_type, section_title")
        .eq("agency_id", agencyId)
        .gte("created_at", since);

      if (error) throw error;
      const rows = (data ?? []) as Array<{
        service_id: string | null;
        event_type: string;
        section_title: string | null;
      }>;

      const map = new Map<string, { title: string; impressions: number; clicks: number }>();
      for (const r of rows) {
        if (!r.service_id) continue;
        const entry = map.get(r.service_id) ?? {
          title: r.section_title ?? r.service_id,
          impressions: 0,
          clicks: 0,
        };
        if (r.event_type === "impression") entry.impressions += 1;
        if (r.event_type === "click") entry.clicks += 1;
        // keep the most descriptive title
        if (r.section_title && entry.title === r.service_id) entry.title = r.section_title;
        map.set(r.service_id, entry);
      }

      return Array.from(map.entries())
        .map(([service_id, v]) => ({
          service_id,
          title: v.title,
          impressions: v.impressions,
          clicks: v.clicks,
          ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
        }))
        .sort((a, b) => b.impressions - a.impressions);
    },
  });

  /* ---------- recentFeed ---------- */
  const recentFeed = useQuery<AIAdFeedRow[], Error>({
    queryKey: ["ai-ad-recent-feed", agencyId, rangeDays],
    enabled: !!agencyId,
    queryFn: async (): Promise<AIAdFeedRow[]> => {
      const { data, error } = await (supabase.from as any)("marketplace_ai_events")
        .select("created_at, request_type, section_title, city_hint, event_type_hint")
        .eq("agency_id", agencyId)
        .eq("event_type", "impression")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as AIAdFeedRow[];
    },
  });

  /* ---------- topKeywords ---------- */
  const topKeywords = useQuery<AIAdKeyword[], Error>({
    queryKey: ["ai-ad-top-keywords", agencyId, rangeDays],
    enabled: !!agencyId,
    queryFn: async (): Promise<AIAdKeyword[]> => {
      const { data, error } = await (supabase.from as any)("marketplace_ai_events")
        .select("matched_keywords")
        .eq("agency_id", agencyId)
        .gte("created_at", since);

      if (error) throw error;
      const rows = (data ?? []) as Array<{ matched_keywords: string[] | null }>;

      const freq = new Map<string, number>();
      for (const r of rows) {
        const kws = r.matched_keywords;
        if (!Array.isArray(kws)) continue;
        for (const kw of kws) {
          const k = String(kw).trim().toLowerCase();
          if (k) freq.set(k, (freq.get(k) ?? 0) + 1);
        }
      }

      return Array.from(freq.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    },
  });

  return { overview, topServices, recentFeed, topKeywords };
}
