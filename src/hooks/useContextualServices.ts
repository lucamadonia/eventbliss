import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Flame, Play, ShoppingBag, Camera, Music,
  Utensils, Mountain, Heart, PartyPopper, Trophy, Building2,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ContextualService {
  slug: string;
  id?: string;                  // DB service id (present for real DB results, undefined for mock fallback)
  title: string;
  agency: string;
  agencyId?: string;            // DB agency id (for ad attribution log)
  agencyTier?: "starter" | "professional" | "enterprise";
  pricePerPerson: number;       // EUR
  priceType: "per_person" | "flat_rate" | "per_hour" | "custom";
  rating: number;
  reviewCount: number;
  gradient: string;
  icon: LucideIcon;
  coverUrl?: string;
  city?: string;
  category: string;
  // Ad-tracking metadata
  matchScore: number;
  matchPosition: number;
  matchedKeywords: string[];
}

export type ServiceSource = "db" | "mock" | "mixed";

export interface UseContextualServicesOptions {
  /** AI response text (will be scanned for keywords) */
  text: string;
  /** Event city for geographic filtering */
  city?: string;
  /** Event type hint — bachelor, birthday, etc. */
  eventType?: string;
  /** Max services to return. Default 6. */
  limit?: number;
  /** Only Enterprise-tier agencies (AI-eligible). Default true. */
  enterpriseOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Keyword → category mapping (single source of truth)
// ---------------------------------------------------------------------------

interface CategoryMatch {
  category: string;
  icon: LucideIcon;
  gradient: string;
  keywords: string[];
}

const CATEGORY_MATCHERS: CategoryMatch[] = [
  {
    category: "catering",
    icon: Utensils,
    gradient: "from-amber-500 to-orange-600",
    keywords: [
      "chef", "koch", "dinner", "feast", "restaurant", "brunch", "gourmet", "cuisine",
      "tasting", "wine", "weinprobe", "brewery", "brauerei", "beer", "bier", "essen",
      "catering", "food", "schlemmen", "cocktail",
    ],
  },
  {
    category: "entertainment",
    icon: PartyPopper,
    gradient: "from-fuchsia-500 to-purple-600",
    keywords: [
      "pub crawl", "bar", "crawl", "nightlife", "bermuda", "club", "casino", "poker",
      "escape", "show", "theater", "entertainment", "unterhaltung", "krimi", "quiz",
      "game night", "drinks", "party", "glücksspiel",
    ],
  },
  {
    category: "music",
    icon: Music,
    gradient: "from-cyan-500 to-blue-600",
    keywords: [
      "dj", "music", "musik", "karaoke", "band", "sound", "disco", "beat", "konzert",
      "concert",
    ],
  },
  {
    category: "photography",
    icon: Camera,
    gradient: "from-indigo-500 to-violet-600",
    keywords: [
      "photo", "foto", "shooting", "camera", "photograph", "memories", "memory",
      "erinnerung", "videograph", "videografin", "videografen",
    ],
  },
  {
    category: "sport",
    icon: Mountain,
    gradient: "from-emerald-500 to-teal-600",
    keywords: [
      "canyoning", "rafting", "adventure", "outdoor", "abenteuer", "wasser", "kletter",
      "climb", "ropes", "sport", "kart", "karting", "bowling", "paintball", "laser",
      "fahrrad", "bike", "wandern", "hiking", "ski",
    ],
  },
  {
    category: "wellness",
    icon: Heart,
    gradient: "from-teal-400 to-cyan-500",
    keywords: [
      "spa", "wellness", "massage", "yoga", "relax", "entspann", "meditation",
      "sauna", "pool", "beauty", "kosmetik",
    ],
  },
  {
    category: "workshop",
    icon: Trophy,
    gradient: "from-rose-500 to-pink-600",
    keywords: [
      "workshop", "course", "class", "kurs", "lehr", "tutorial", "lernen",
      "training", "crafting", "basteln",
    ],
  },
  {
    category: "venue",
    icon: Building2,
    gradient: "from-slate-500 to-slate-700",
    keywords: [
      "venue", "location", "raum", "hotel", "accommodation", "unterkunft",
      "house", "villa", "lodge", "chalet",
    ],
  },
];

// ---------------------------------------------------------------------------
// Inline mock fallback (shown only when DB returns 0)
// ---------------------------------------------------------------------------

type MockService = Omit<ContextualService, "matchScore" | "matchPosition" | "matchedKeywords">;

const MOCK_CATALOG: MockService[] = [
  {
    slug: "private-chef-dinner",
    title: "Private Chef Dinner",
    agency: "Gourmet Events",
    pricePerPerson: 89,
    priceType: "per_person",
    rating: 5.0,
    reviewCount: 12,
    gradient: "from-amber-500 to-orange-600",
    icon: Utensils,
    category: "catering",
  },
  {
    slug: "wine-tasting-premium",
    title: "Wine Tasting Premium",
    agency: "Gourmet Events",
    pricePerPerson: 49,
    priceType: "per_person",
    rating: 4.9,
    reviewCount: 34,
    gradient: "from-rose-500 to-pink-600",
    icon: Sparkles,
    category: "catering",
  },
  {
    slug: "event-fotoshooting",
    title: "Event Fotoshooting",
    agency: "Lens Masters",
    pricePerPerson: 35,
    priceType: "per_person",
    rating: 4.8,
    reviewCount: 51,
    gradient: "from-indigo-500 to-violet-600",
    icon: Camera,
    category: "photography",
  },
  {
    slug: "adventure-canyoning",
    title: "Canyoning & Rafting",
    agency: "Black Forest Adventures",
    pricePerPerson: 89,
    priceType: "per_person",
    rating: 4.9,
    reviewCount: 22,
    gradient: "from-emerald-500 to-teal-600",
    icon: Mountain,
    category: "sport",
  },
  {
    slug: "pub-crawl-premium",
    title: "City Pub Crawl",
    agency: "Nightlife Co",
    pricePerPerson: 39,
    priceType: "per_person",
    rating: 4.7,
    reviewCount: 88,
    gradient: "from-fuchsia-500 to-purple-600",
    icon: Flame,
    category: "entertainment",
  },
  {
    slug: "casino-night",
    title: "Casino Night Package",
    agency: "Royal Gaming Events",
    pricePerPerson: 79,
    priceType: "per_person",
    rating: 4.8,
    reviewCount: 17,
    gradient: "from-yellow-500 to-amber-600",
    icon: Sparkles,
    category: "entertainment",
  },
  {
    slug: "dj-premium-mobile",
    title: "Mobile DJ & Soundsystem",
    agency: "BeatMasters",
    pricePerPerson: 29,
    priceType: "per_person",
    rating: 4.9,
    reviewCount: 64,
    gradient: "from-cyan-500 to-blue-600",
    icon: Music,
    category: "music",
  },
  {
    slug: "wellness-spa-day",
    title: "Spa & Wellness Day",
    agency: "Zen Retreats",
    pricePerPerson: 119,
    priceType: "per_person",
    rating: 4.9,
    reviewCount: 19,
    gradient: "from-teal-400 to-cyan-500",
    icon: Heart,
    category: "wellness",
  },
];

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreCategories(text: string): Array<{ category: string; score: number; meta: CategoryMatch }> {
  const lower = text.toLowerCase();
  return CATEGORY_MATCHERS
    .map((m) => ({
      category: m.category,
      score: m.keywords.reduce((acc, kw) => {
        if (!kw) return acc;
        return lower.includes(kw.toLowerCase()) ? acc + 1 : acc;
      }, 0),
      meta: m,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

function categoryMeta(category: string): { icon: LucideIcon; gradient: string } {
  const hit = CATEGORY_MATCHERS.find((m) => m.category === category);
  return hit
    ? { icon: hit.icon, gradient: hit.gradient }
    : { icon: ShoppingBag, gradient: "from-slate-500 to-slate-700" };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useContextualServices({
  text,
  city,
  limit = 6,
  enterpriseOnly = true,
}: UseContextualServicesOptions) {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "de").slice(0, 2).toLowerCase();

  const scoredCategories = useMemo(() => scoreCategories(text), [text]);
  const categories = useMemo(() => scoredCategories.map((c) => c.category), [scoredCategories]);

  /** Returns the list of keywords from the original text that hit this category. */
  const matchedKeywordsForCategory = (cat: string): string[] => {
    const matcher = CATEGORY_MATCHERS.find((m) => m.category === cat);
    if (!matcher) return [];
    const lower = text.toLowerCase();
    return matcher.keywords.filter((kw) => lower.includes(kw.toLowerCase())).slice(0, 5);
  };

  const categoryScoreMap = useMemo(() => {
    const m = new Map<string, number>();
    scoredCategories.forEach((c) => m.set(c.category, c.score));
    return m;
  }, [scoredCategories]);

  const query = useQuery({
    queryKey: ["contextual-services", categories, city, enterpriseOnly, limit, locale],
    enabled: categories.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      if (categories.length === 0) return [] as ContextualService[];

      // Run in parallel for the top 3 categories (widest net)
      const topCats = categories.slice(0, 3);
      const perCat = Math.max(2, Math.ceil(limit / topCats.length));

      const fetches = topCats.map(async (cat) => {
        let q = (supabase.from as any)("marketplace_services")
          .select("id, slug, category, price_cents, price_type, avg_rating, review_count, cover_image_url, location_city, agency_id, agencies!inner(name, slug, logo_url, marketplace_tier)")
          .eq("status", "approved")
          .eq("category", cat);

        if (enterpriseOnly) {
          q = q.eq("agencies.marketplace_tier", "enterprise");
        }
        if (city) {
          q = q.ilike("location_city", `%${city}%`);
        }

        q = q
          .order("is_featured", { ascending: false })
          .order("booking_count", { ascending: false })
          .order("avg_rating", { ascending: false })
          .limit(perCat);

        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) return [];

        // Fetch localized titles — preferred locale + de + en
        const ids = data.map((s: any) => s.id);
        const localeSet = Array.from(new Set([locale, "de", "en"]));
        const { data: translations } = await (supabase.from as any)("marketplace_service_translations")
          .select("service_id, locale, title")
          .in("service_id", ids)
          .in("locale", localeSet);

        const priority = (l: string) => (l === locale ? 3 : l === "de" ? 2 : l === "en" ? 1 : 0);
        const titleByService = new Map<string, string>();
        for (const row of (translations as { service_id: string; locale: string; title: string }[]) ?? []) {
          const existing = titleByService.get(row.service_id);
          const existingLocale = existing ? (translations as { service_id: string; locale: string; title: string }[]).find(t => t.service_id === row.service_id && t.title === existing)?.locale : "";
          if (!existing || priority(row.locale) > priority(existingLocale || "")) {
            titleByService.set(row.service_id, row.title);
          }
        }

        const catKeywords = matchedKeywordsForCategory(cat);
        const catScore = categoryScoreMap.get(cat) ?? 0;

        return data.map((s: any) => {
          const meta = categoryMeta(s.category);
          const pricePerPerson = Math.round((s.price_cents ?? 0) / 100);
          return {
            id: s.id,
            slug: s.slug,
            title: titleByService.get(s.id) || s.slug,
            agency: s.agencies?.name ?? "",
            agencyId: s.agency_id,
            agencyTier: (s.agencies?.marketplace_tier as ContextualService["agencyTier"]) ?? "starter",
            pricePerPerson,
            priceType: s.price_type as ContextualService["priceType"],
            rating: Number(s.avg_rating ?? 0),
            reviewCount: Number(s.review_count ?? 0),
            gradient: meta.gradient,
            icon: meta.icon,
            coverUrl: s.cover_image_url ?? undefined,
            city: s.location_city ?? undefined,
            category: s.category,
            matchScore: catScore,
            matchPosition: 0, // set after final sort
            matchedKeywords: catKeywords,
          } as ContextualService;
        });
      });

      const flat = (await Promise.all(fetches)).flat();

      // Dedupe by slug, keep highest-scoring version
      const bySlug = new Map<string, ContextualService>();
      for (const s of flat) {
        const existing = bySlug.get(s.slug);
        if (!existing || (s.matchScore > existing.matchScore)) {
          bySlug.set(s.slug, s);
        }
      }

      const uniq = Array.from(bySlug.values())
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      // Assign 1-based match position after final sort
      uniq.forEach((s, i) => { s.matchPosition = i + 1; });

      return uniq;
    },
  });

  const fallbackServices = useMemo<ContextualService[]>(() => {
    if (categories.length === 0) return [];
    const hits: ContextualService[] = [];
    for (const cat of categories) {
      const catKeywords = matchedKeywordsForCategory(cat);
      const catScore = categoryScoreMap.get(cat) ?? 0;
      for (const svc of MOCK_CATALOG) {
        if (svc.category === cat && !hits.find((h) => h.slug === svc.slug)) {
          hits.push({
            ...svc,
            matchScore: catScore,
            matchPosition: hits.length + 1,
            matchedKeywords: catKeywords,
          });
        }
      }
    }
    return hits.slice(0, limit);
  }, [categories, limit, categoryScoreMap, text]);

  const dbServices = query.data ?? [];
  const services = dbServices.length > 0 ? dbServices : fallbackServices;
  const source: ServiceSource = dbServices.length > 0
    ? (dbServices.length < fallbackServices.length ? "mixed" : "db")
    : "mock";

  return {
    services,
    source,
    categories,
    isLoading: query.isLoading,
  };
}

// Export matchers so other components can reuse (e.g. section-local keyword picker)
export { CATEGORY_MATCHERS, MOCK_CATALOG, categoryMeta, scoreCategories };
