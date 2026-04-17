import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminAIAdsOverview {
  impressions: number;
  clicks: number;
  attributedBookings: number;
  attributedRevenueCents: number;
  ctr: number;
}

export interface AgencyAIPerformanceRow {
  agency_id: string;
  agency_name: string;
  agency_slug: string;
  marketplace_tier: string;
  impressions: number;
  clicks: number;
  attributed_bookings: number;
  attributed_revenue_cents: number;
  ctr: number;
  last_event_at: string | null;
}

export interface ServiceAIPerformanceRow {
  service_id: string;
  title: string;
  agency_name: string;
  agency_tier: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface TimelinePoint {
  day: string;         // YYYY-MM-DD
  impressions: number;
  clicks: number;
}

export interface RequestTypeBucket {
  request_type: string;
  impressions: number;
  clicks: number;
}

export interface TierCtrBucket {
  tier: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAIAdStatsAdmin(rangeDays = 30) {
  // ───── KPI overview (aggregate, last N days) ─────
  const overview = useQuery({
    queryKey: ["admin-ai-ads-overview", rangeDays],
    staleTime: 60_000,
    queryFn: async (): Promise<AdminAIAdsOverview> => {
      const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

      const [imp, clk, battr, revRows] = await Promise.all([
        (supabase.from as any)("marketplace_ai_events")
          .select("*", { count: "exact", head: true })
          .eq("event_kind", "impression")
          .gte("created_at", since),
        (supabase.from as any)("marketplace_ai_events")
          .select("*", { count: "exact", head: true })
          .eq("event_kind", "click")
          .gte("created_at", since),
        (supabase.from as any)("marketplace_ai_events")
          .select("*", { count: "exact", head: true })
          .eq("event_kind", "booking_attributed")
          .gte("created_at", since),
        (supabase.from as any)("marketplace_bookings")
          .select("total_price_cents, created_at, source")
          .eq("source", "ai_contextual")
          .gte("created_at", since),
      ]);

      const impressions = imp.count || 0;
      const clicks = clk.count || 0;
      const attributedBookings = battr.count || 0;
      const attributedRevenueCents = ((revRows.data as Array<{ total_price_cents: number }> | null) ?? [])
        .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);
      const ctr = impressions > 0 ? clicks / impressions : 0;

      return { impressions, clicks, attributedBookings, attributedRevenueCents, ctr };
    },
  });

  // ───── Top agencies (aggregated view) ─────
  const topAgencies = useQuery({
    queryKey: ["admin-ai-ads-top-agencies"],
    staleTime: 60_000,
    queryFn: async (): Promise<AgencyAIPerformanceRow[]> => {
      const { data } = await (supabase.from as any)("v_agency_ai_performance")
        .select("*")
        .order("impressions", { ascending: false })
        .limit(10);
      return (data as AgencyAIPerformanceRow[]) ?? [];
    },
  });

  // ───── Top services ─────
  const topServices = useQuery({
    queryKey: ["admin-ai-ads-top-services", rangeDays],
    staleTime: 60_000,
    queryFn: async (): Promise<ServiceAIPerformanceRow[]> => {
      const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();

      const { data: events } = await (supabase.from as any)("marketplace_ai_events")
        .select("service_id, event_kind")
        .gte("created_at", since);

      if (!events) return [];
      const counts = new Map<string, { impressions: number; clicks: number }>();
      for (const e of events as Array<{ service_id: string; event_kind: string }>) {
        const row = counts.get(e.service_id) ?? { impressions: 0, clicks: 0 };
        if (e.event_kind === "impression") row.impressions++;
        else if (e.event_kind === "click") row.clicks++;
        counts.set(e.service_id, row);
      }

      const topIds = Array.from(counts.entries())
        .sort((a, b) => b[1].impressions - a[1].impressions)
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) return [];

      const { data: services } = await (supabase.from as any)("marketplace_services")
        .select("id, slug, agencies!inner(name, marketplace_tier)")
        .in("id", topIds);

      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("service_id, locale, title")
        .in("service_id", topIds)
        .in("locale", ["de", "en"]);

      const titleByService = new Map<string, string>();
      for (const row of (translations as Array<{ service_id: string; locale: string; title: string }>) ?? []) {
        const existing = titleByService.get(row.service_id);
        if (!existing || row.locale === "de") titleByService.set(row.service_id, row.title);
      }

      return ((services as any[]) ?? []).map((s) => {
        const c = counts.get(s.id) ?? { impressions: 0, clicks: 0 };
        const ctr = c.impressions > 0 ? c.clicks / c.impressions : 0;
        return {
          service_id: s.id,
          title: titleByService.get(s.id) || s.slug,
          agency_name: s.agencies?.name ?? "",
          agency_tier: s.agencies?.marketplace_tier ?? "starter",
          impressions: c.impressions,
          clicks: c.clicks,
          ctr,
        };
      }).sort((a, b) => b.impressions - a.impressions);
    },
  });

  // ───── Daily timeline ─────
  const timeline = useQuery({
    queryKey: ["admin-ai-ads-timeline", rangeDays],
    staleTime: 60_000,
    queryFn: async (): Promise<TimelinePoint[]> => {
      const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();
      const { data } = await (supabase.from as any)("marketplace_ai_events")
        .select("created_at, event_kind")
        .in("event_kind", ["impression", "click"])
        .gte("created_at", since);

      const byDay = new Map<string, { impressions: number; clicks: number }>();
      for (const r of (data as Array<{ created_at: string; event_kind: string }>) ?? []) {
        const day = r.created_at.slice(0, 10);
        const row = byDay.get(day) ?? { impressions: 0, clicks: 0 };
        if (r.event_kind === "impression") row.impressions++;
        else if (r.event_kind === "click") row.clicks++;
        byDay.set(day, row);
      }

      return Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, v]) => ({ day, ...v }));
    },
  });

  // ───── Request-type breakdown ─────
  const requestBreakdown = useQuery({
    queryKey: ["admin-ai-ads-request-breakdown", rangeDays],
    staleTime: 60_000,
    queryFn: async (): Promise<RequestTypeBucket[]> => {
      const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();
      const { data } = await (supabase.from as any)("marketplace_ai_events")
        .select("request_type, event_kind")
        .in("event_kind", ["impression", "click"])
        .gte("created_at", since);

      const byType = new Map<string, { impressions: number; clicks: number }>();
      for (const r of (data as Array<{ request_type: string; event_kind: string }>) ?? []) {
        const key = r.request_type || "unknown";
        const row = byType.get(key) ?? { impressions: 0, clicks: 0 };
        if (r.event_kind === "impression") row.impressions++;
        else if (r.event_kind === "click") row.clicks++;
        byType.set(key, row);
      }

      return Array.from(byType.entries())
        .sort((a, b) => b[1].impressions - a[1].impressions)
        .map(([request_type, v]) => ({ request_type, ...v }));
    },
  });

  // ───── CTR by tier ─────
  const tierCtr = useQuery({
    queryKey: ["admin-ai-ads-tier-ctr", rangeDays],
    staleTime: 60_000,
    queryFn: async (): Promise<TierCtrBucket[]> => {
      const since = new Date(Date.now() - rangeDays * 24 * 3600 * 1000).toISOString();
      const { data } = await (supabase.from as any)("marketplace_ai_events")
        .select("agency_tier_at_event, event_kind")
        .in("event_kind", ["impression", "click"])
        .gte("created_at", since);

      const byTier = new Map<string, { impressions: number; clicks: number }>();
      for (const r of (data as Array<{ agency_tier_at_event: string; event_kind: string }>) ?? []) {
        const key = r.agency_tier_at_event || "unknown";
        const row = byTier.get(key) ?? { impressions: 0, clicks: 0 };
        if (r.event_kind === "impression") row.impressions++;
        else if (r.event_kind === "click") row.clicks++;
        byTier.set(key, row);
      }

      return Array.from(byTier.entries()).map(([tier, v]) => ({
        tier,
        impressions: v.impressions,
        clicks: v.clicks,
        ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
      }));
    },
  });

  // ───── Recent events log ─────
  const recentEvents = useQuery({
    queryKey: ["admin-ai-ads-recent"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await (supabase.from as any)("marketplace_ai_events")
        .select("id, event_kind, service_id, agency_id, request_type, match_category, match_position, section_title, city_hint, event_type_hint, agency_tier_at_event, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data as any[]) ?? [];
    },
  });

  return {
    overview,
    topAgencies,
    topServices,
    timeline,
    requestBreakdown,
    tierCtr,
    recentEvents,
  };
}
