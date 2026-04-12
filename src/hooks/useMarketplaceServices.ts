import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketplaceFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
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
  return useQuery({
    queryKey: ["marketplace-services", filters, page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Build base query on approved services
      let query = (supabase.from as any)("marketplace_services")
        .select("*, agencies!inner(name, slug, logo_url, marketplace_tier)", { count: "exact" })
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("avg_rating", { ascending: false })
        .range(from, to);

      if (filters.category) query = query.eq("category", filters.category);
      if (filters.city) query = query.ilike("location_city", `%${filters.city}%`);
      if (filters.minPrice != null) query = query.gte("price_cents", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price_cents", filters.maxPrice);
      if (filters.minRating != null) query = query.gte("avg_rating", filters.minRating);

      const { data: services, count, error } = await query;
      if (error) throw error;
      if (!services || services.length === 0) return { services: [], total: 0 };

      // Fetch translations for all returned services (prefer DE, fallback EN)
      const ids = services.map((s: any) => s.id);
      const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
        .select("*")
        .in("service_id", ids)
        .in("locale", ["de", "en"]);

      // Build translation map (prefer DE)
      const txMap = new Map<string, any>();
      for (const tx of translations || []) {
        const existing = txMap.get(tx.service_id);
        if (!existing || tx.locale === "de") txMap.set(tx.service_id, tx);
      }

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
