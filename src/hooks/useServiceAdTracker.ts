import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ContextualService } from "@/hooks/useContextualServices";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdSourceLocation =
  | "inline_section"
  | "aggregate_bottom"
  | "marketplace_card"
  | "agency_page";

export interface AdTrackContext {
  requestType?: string;          // trip_ideas|activities|day_plan|budget_estimate|recommend_services
  eventId?: string;              // the user's EventBliss event id
  sourceLocation: AdSourceLocation;
  sectionTitle?: string;         // if inline_section
  responseExcerpt?: string;      // first 500 chars of the full AI response
  cityHint?: string;
  eventTypeHint?: string;
}

interface ImpressionRow {
  event_kind: "impression";
  service_id: string;
  agency_id: string;
  user_id: string | null;
  user_event_id: string | null;
  request_type: string | null;
  matched_keywords: string[] | null;
  match_category: string | null;
  match_position: number | null;
  match_score: number | null;
  source_location: string;
  section_title: string | null;
  ai_response_excerpt: string | null;
  locale: string;
  city_hint: string | null;
  event_type_hint: string | null;
  agency_tier_at_event: string | null;
  referrer_path: string | null;
  user_agent: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trimExcerpt(text: string | undefined): string | null {
  if (!text) return null;
  return text.slice(0, 500);
}

function makeKey(service: ContextualService, ctx: AdTrackContext): string {
  // Dedup within one mount: same service + same section + same location = one impression
  return `${service.slug}::${ctx.sourceLocation}::${ctx.sectionTitle ?? ""}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Ad attribution tracker for AI-recommended services. Fire-and-forget inserts,
 * dedup per render, skips self-inflation (agency members viewing own services).
 */
export function useServiceAdTracker() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const locale = (i18n.language || "de").slice(0, 2).toLowerCase();

  const impressionDedup = useRef<Set<string>>(new Set());
  const pendingQueue = useRef<ImpressionRow[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ───── Cache agency memberships to avoid self-inflation ─────
  const { data: memberAgencyIds } = useQuery({
    queryKey: ["my-agency-memberships", user?.id],
    enabled: !!user?.id,
    staleTime: 300_000, // 5 min
    queryFn: async () => {
      if (!user?.id) return new Set<string>();
      const { data } = await (supabase.from as any)("agency_members")
        .select("agency_id")
        .eq("user_id", user.id);
      return new Set<string>(((data as Array<{ agency_id: string }>) ?? []).map((r) => r.agency_id));
    },
  });

  const isOwnAgency = useCallback(
    (agencyId: string | undefined) => !!agencyId && !!memberAgencyIds?.has(agencyId),
    [memberAgencyIds],
  );

  // ───── Flush batched impressions ─────
  const flush = useCallback(async () => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    const batch = pendingQueue.current;
    if (batch.length === 0) return;
    pendingQueue.current = [];
    try {
      await (supabase.from as any)("marketplace_ai_events").insert(batch);
    } catch {
      // Fire-and-forget; never surface tracking failures to users
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flush();
    }, 150);
  }, [flush]);

  useEffect(() => {
    return () => {
      // On unmount, flush anything pending
      if (flushTimer.current) clearTimeout(flushTimer.current);
      if (pendingQueue.current.length > 0) {
        (supabase.from as any)("marketplace_ai_events")
          .insert(pendingQueue.current)
          .then(() => {})
          .catch(() => {});
        pendingQueue.current = [];
      }
    };
  }, []);

  // ───── Public: queue impressions ─────
  const trackImpressions = useCallback(
    (services: ContextualService[], ctx: AdTrackContext) => {
      if (!user?.id || services.length === 0) return;
      const referrer = typeof window !== "undefined" ? window.location.pathname : null;
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const excerpt = trimExcerpt(ctx.responseExcerpt);

      for (const svc of services) {
        if (!svc.id || !svc.agencyId) continue;        // need DB ids for a valid log
        if (isOwnAgency(svc.agencyId)) continue;       // self-inflation guard
        const key = makeKey(svc, ctx);
        if (impressionDedup.current.has(key)) continue;
        impressionDedup.current.add(key);

        pendingQueue.current.push({
          event_kind: "impression",
          service_id: svc.id,
          agency_id: svc.agencyId,
          user_id: user.id,
          user_event_id: ctx.eventId ?? null,
          request_type: ctx.requestType ?? null,
          matched_keywords: svc.matchedKeywords && svc.matchedKeywords.length ? svc.matchedKeywords : null,
          match_category: svc.category ?? null,
          match_position: svc.matchPosition ?? null,
          match_score: svc.matchScore ?? null,
          source_location: ctx.sourceLocation,
          section_title: ctx.sectionTitle ?? null,
          ai_response_excerpt: excerpt,
          locale,
          city_hint: ctx.cityHint ?? null,
          event_type_hint: ctx.eventTypeHint ?? null,
          agency_tier_at_event: svc.agencyTier ?? null,
          referrer_path: referrer,
          user_agent: ua,
        });
      }
      scheduleFlush();
    },
    [user?.id, isOwnAgency, locale, scheduleFlush],
  );

  // ───── Public: track a click, return impression_id if available ─────
  const trackClick = useCallback(
    async (service: ContextualService, ctx: AdTrackContext): Promise<string | null> => {
      if (!user?.id || !service.id || !service.agencyId) return null;
      if (isOwnAgency(service.agencyId)) return null;

      // Flush any pending impressions first so we can link back
      await flush();

      // Find the most recent impression for this (user, service) to link FK
      let impressionId: string | null = null;
      try {
        const { data } = await (supabase.from as any)("marketplace_ai_events")
          .select("id")
          .eq("user_id", user.id)
          .eq("service_id", service.id)
          .eq("event_kind", "impression")
          .order("created_at", { ascending: false })
          .limit(1);
        impressionId = ((data as Array<{ id: string }> | null) ?? [])[0]?.id ?? null;
      } catch {
        /* ignore */
      }

      try {
        const { data: inserted } = await (supabase.from as any)("marketplace_ai_events")
          .insert({
            event_kind: "click",
            service_id: service.id,
            agency_id: service.agencyId,
            user_id: user.id,
            user_event_id: ctx.eventId ?? null,
            impression_id: impressionId,
            request_type: ctx.requestType ?? null,
            matched_keywords: service.matchedKeywords && service.matchedKeywords.length ? service.matchedKeywords : null,
            match_category: service.category ?? null,
            match_position: service.matchPosition ?? null,
            match_score: service.matchScore ?? null,
            source_location: ctx.sourceLocation,
            section_title: ctx.sectionTitle ?? null,
            locale,
            city_hint: ctx.cityHint ?? null,
            event_type_hint: ctx.eventTypeHint ?? null,
            agency_tier_at_event: service.agencyTier ?? null,
            referrer_path: typeof window !== "undefined" ? window.location.pathname : null,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          })
          .select("id")
          .single();
        return (inserted as { id: string } | null)?.id ?? null;
      } catch {
        return null;
      }
    },
    [user?.id, isOwnAgency, locale, flush],
  );

  return { trackImpressions, trackClick };
}
