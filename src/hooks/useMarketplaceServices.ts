import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPPORTED_LOCALES = ["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"] as const;

function resolvePreferredLocale(lang: string | undefined): string {
  const code = (lang || "de").slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? code : "de";
}

interface TranslationRow {
  service_id: string;
  locale: string;
  title?: string | null;
  description?: string | null;
  short_description?: string | null;
  includes?: string[] | null;
  requirements?: string[] | null;
}

function pickTranslation(
  rows: TranslationRow[],
  preferred: string,
): Map<string, TranslationRow> {
  const priority = (loc: string): number => {
    if (loc === preferred) return 3;
    if (loc === "de") return 2;
    if (loc === "en") return 1;
    return 0;
  };
  const map = new Map<string, TranslationRow>();
  for (const row of rows) {
    const existing = map.get(row.service_id);
    if (!existing || priority(row.locale) > priority(existing.locale)) {
      map.set(row.service_id, row);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketplaceFilters {
  category?: string;
  subcategory?: string;
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  minParticipants?: number;
  maxParticipants?: number;
  maxDurationMinutes?: number;
  minDurationMinutes?: number;
  locationType?: string;              // 'on_site' | 'at_agency' | 'online' | 'flexible'
  priceType?: string;                 // 'per_person' | 'flat_rate' | 'per_hour' | 'custom'
  agencyTier?: string;                // 'professional' | 'enterprise' — tier preference
  featuredOnly?: boolean;
  autoConfirmOnly?: boolean;
  sortBy?: "popularity" | "rating" | "price_asc" | "price_desc" | "newest";
}

export interface MarketplaceService {
  id: string;
  slug: string;
  category: string;
  subcategory: string | null;
  price_cents: number;
  price_type: string;
  min_participants: number | null;
  max_participants: number | null;
  duration_minutes: number | null;
  location_type: string;
  location_city: string | null;
  location_country: string;
  cover_image_url: string | null;
  gallery_urls: string[];
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  booking_count: number;
  cancellation_policy: string;
  auto_confirm: boolean;
  created_at: string;
  // Joined translation
  title: string;
  short_description: string | null;
  description: string | null;
  includes: string[];
  requirements: string[];
  // Joined agency
  agency_id: string;
  agency_name: string;
  agency_slug: string;
  agency_logo: string | null;
  agency_tier: string;
}

// ---------------------------------------------------------------------------
// Hook: Browse marketplace
// ---------------------------------------------------------------------------

export function useMarketplaceServices(
  filters: MarketplaceFilters = {},
  page = 1,
  limit = 12,
) {
  const { i18n } = useTranslation();
  const preferredLocale = resolvePreferredLocale(i18n.language);
  return useQuery({
    queryKey: ["marketplace-services", filters, page, limit, preferredLocale],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Build base query on approved services
      let query = (supabase.from as any)("marketplace_services")
        .select("*, agencies!inner(name, slug, logo_url, marketplace_tier)", { count: "exact" })
        .eq("status", "approved");

      // Apply sort
      switch (filters.sortBy) {
        case "rating":
          query = query.order("avg_rating", { ascending: false });
          break;
        case "price_asc":
          query = query.order("price_cents", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price_cents", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "popularity":
        default:
          query = query.order("is_featured", { ascending: false })
            .order("booking_count", { ascending: false })
            .order("avg_rating", { ascending: false });
          break;
      }
      query = query.range(from, to);

      if (filters.category) query = query.eq("category", filters.category);
      if (filters.subcategory) query = query.ilike("subcategory", `%${filters.subcategory}%`);
      if (filters.city) query = query.ilike("location_city", `%${filters.city}%`);
      if (filters.country) query = query.eq("location_country", filters.country);
      if (filters.minPrice != null) query = query.gte("price_cents", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price_cents", filters.maxPrice);
      if (filters.minRating != null) query = query.gte("avg_rating", filters.minRating);
      if (filters.minParticipants != null) query = query.gte("max_participants", filters.minParticipants);
      if (filters.maxParticipants != null) query = query.lte("min_participants", filters.maxParticipants);
      if (filters.minDurationMinutes != null) query = query.gte("duration_minutes", filters.minDurationMinutes);
      if (filters.maxDurationMinutes != null) query = query.lte("duration_minutes", filters.maxDurationMinutes);
      if (filters.locationType) query = query.eq("location_type", filters.locationType);
      if (filters.priceType) query = query.eq("price_type", filters.priceType);
      if (filters.featuredOnly) query = query.eq("is_featured", true);
      if (filters.autoConfirmOnly) query = query.eq("auto_confirm", true);

      const { data: services, count, error } = await query;
      if (error) throw error;
      if (!services || services.length === 0) return { services: [], total: 0 };

      // Fetch translations — preferred locale + de + en as fallback chain
      const ids = services.map((s: any) => s.id);
      const localeSet = Array.from(new Set([preferredLocale, "de", "en"]));
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("*")
        .in("service_id", ids)
        .in("locale", localeSet);

      const txMap = pickTranslation((translations as TranslationRow[]) ?? [], preferredLocale);

      // Map to MarketplaceService
      const mapped: MarketplaceService[] = services.map((s: any) => {
        const tx = txMap.get(s.id);
        return {
          id: s.id,
          slug: s.slug,
          category: s.category,
          subcategory: s.subcategory,
          price_cents: s.price_cents,
          price_type: s.price_type,
          min_participants: s.min_participants,
          max_participants: s.max_participants,
          duration_minutes: s.duration_minutes,
          location_type: s.location_type,
          location_city: s.location_city,
          location_country: s.location_country,
          cover_image_url: s.cover_image_url,
          gallery_urls: s.gallery_urls || [],
          is_featured: s.is_featured,
          avg_rating: s.avg_rating,
          review_count: s.review_count,
          booking_count: s.booking_count,
          cancellation_policy: s.cancellation_policy,
          auto_confirm: s.auto_confirm,
          created_at: s.created_at,
          title: tx?.title || "Untitled",
          short_description: tx?.short_description || null,
          description: tx?.description || null,
          includes: tx?.includes || [],
          requirements: tx?.requirements || [],
          agency_id: s.agency_id,
          agency_name: s.agencies?.name || "",
          agency_slug: s.agencies?.slug || "",
          agency_logo: s.agencies?.logo_url || null,
          agency_tier: s.agencies?.marketplace_tier || "starter",
        };
      });

      // Client-side search filter (on title/description)
      let result = mapped;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = mapped.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            (s.short_description || "").toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q),
        );
      }

      return { services: result, total: count || result.length };
    },
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Hook: Single service by slug
// ---------------------------------------------------------------------------

export function useMarketplaceServiceBySlug(slug: string | undefined) {
  const { i18n } = useTranslation();
  const preferredLocale = resolvePreferredLocale(i18n.language);
  return useQuery({
    queryKey: ["marketplace-service", slug, preferredLocale],
    enabled: !!slug,
    queryFn: async () => {
      // 1. Fetch the service with agency join
      const { data: service, error } = await (supabase.from as any)("marketplace_services")
        .select("*, agencies!inner(name, slug, logo_url, marketplace_tier, city)")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;
      if (!service) return null;

      // 2. Fetch translation (preferred locale + de + en fallback)
      const localeSet = Array.from(new Set([preferredLocale, "de", "en"]));
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("*")
        .eq("service_id", service.id)
        .in("locale", localeSet);

      const txMap = pickTranslation((translations as TranslationRow[]) ?? [], preferredLocale);
      const tx = txMap.get(service.id) ?? null;

      // 3. Map to MarketplaceService (extended with agency_city)
      const mapped: MarketplaceService & { agency_city: string | null } = {
        id: service.id,
        slug: service.slug,
        category: service.category,
        subcategory: service.subcategory,
        price_cents: service.price_cents,
        price_type: service.price_type,
        min_participants: service.min_participants,
        max_participants: service.max_participants,
        duration_minutes: service.duration_minutes,
        location_type: service.location_type,
        location_city: service.location_city,
        location_country: service.location_country,
        cover_image_url: service.cover_image_url,
        gallery_urls: service.gallery_urls || [],
        is_featured: service.is_featured,
        avg_rating: service.avg_rating,
        review_count: service.review_count,
        booking_count: service.booking_count,
        cancellation_policy: service.cancellation_policy,
        auto_confirm: service.auto_confirm,
        created_at: service.created_at,
        title: tx?.title || "Untitled",
        short_description: tx?.short_description || null,
        description: tx?.description || null,
        includes: tx?.includes || [],
        requirements: tx?.requirements || [],
        agency_id: service.agency_id,
        agency_name: service.agencies?.name || "",
        agency_slug: service.agencies?.slug || "",
        agency_logo: service.agencies?.logo_url || null,
        agency_tier: service.agencies?.marketplace_tier || "starter",
        agency_city: service.agencies?.city || service.location_city || null,
      };

      return mapped;
    },
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutation: Create a booking from the service detail page
// ---------------------------------------------------------------------------

export interface CreateBookingInput {
  serviceId: string;
  agencyId: string;
  bookingDate: string;
  bookingTime: string;
  participantCount: number;
  unitPriceCents: number;
  totalPriceCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
  eventId?: string;
  autoConfirm?: boolean;
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Du musst eingeloggt sein, um zu buchen.");

      const platformFeeCents = Math.round(input.totalPriceCents * 0.10);
      const agencyPayoutCents = input.totalPriceCents - platformFeeCents;

      // Create booking — use auto_confirm to set status directly,
      // or "pending_confirmation" if agency needs to confirm manually.
      // Stripe Checkout is optional and only used when Edge Functions are deployed.
      const status = input.autoConfirm ? "confirmed" : "pending_confirmation";

      const { data, error } = await (supabase.from as any)("marketplace_bookings")
        .insert({
          service_id: input.serviceId,
          agency_id: input.agencyId,
          customer_id: user.id,
          event_id: input.eventId || null,
          status,
          booking_date: input.bookingDate,
          booking_time: input.bookingTime,
          participant_count: input.participantCount,
          unit_price_cents: input.unitPriceCents,
          total_price_cents: input.totalPriceCents,
          platform_fee_cents: platformFeeCents,
          agency_payout_cents: agencyPayoutCents,
          currency: "EUR",
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone || null,
          customer_notes: input.customerNotes || null,
          confirmed_at: input.autoConfirm ? new Date().toISOString() : null,
        })
        .select("id, booking_number")
        .single();

      if (error) throw error;

      const booking = data as { id: string; booking_number: string };

      // Try Stripe Checkout if Edge Function is deployed (optional)
      let checkoutUrl: string | undefined;
      try {
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
          "marketplace-checkout",
          { body: { booking_id: booking.id } },
        );
        if (!checkoutError && checkoutData?.url) {
          checkoutUrl = checkoutData.url as string;
        }
      } catch {
        // Stripe not configured — booking works without payment for now
      }

      return {
        id: booking.id,
        booking_number: booking.booking_number,
        checkoutUrl,
      };
    },
    onSuccess: (data) => {
      toast.success(`Buchung erstellt! Nr. ${data.booking_number}`);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["event-bookings"] });
      qc.invalidateQueries({ queryKey: ["service-availability"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
