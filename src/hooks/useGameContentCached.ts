/**
 * useGameContentCached — dynamic game content loader with multi-layer caching.
 *
 * Loading priority:
 * 1. React-Query in-memory cache (5 min staleTime)
 * 2. localStorage cache (24h TTL)
 * 3. Supabase game_content table
 * 4. Static fallback files (always available offline)
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import i18n from "i18next";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours localStorage TTL
const STALE_TIME = 5 * 60 * 1000; // 5 min React-Query staleTime

interface CacheEntry<T> {
  data: T[];
  ts: number;
  lang: string;
}

function getCacheKey(gameId: string, contentType: string, lang: string): string {
  return `eb.gc.${gameId}.${contentType}.${lang}`;
}

function readLocalCache<T>(key: string, lang: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.lang !== lang) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeLocalCache<T>(key: string, data: T[], lang: string): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now(), lang };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full — ignore
  }
}

/**
 * Fetch game content from Supabase with localStorage + React-Query caching.
 * Returns typed array of content items.
 */
export function useGameContentCached<T = Record<string, unknown>>(
  gameId: string,
  contentType: string,
  options?: {
    enabled?: boolean;
    fallback?: T[];
  },
) {
  const lang = i18n.language?.split("-")[0] || "de";
  const cacheKey = getCacheKey(gameId, contentType, lang);

  return useQuery<T[]>({
    queryKey: ["game-content-cached", gameId, contentType, lang],
    queryFn: async () => {
      // 1. Check localStorage
      const cached = readLocalCache<T>(cacheKey, lang);
      if (cached && cached.length > 0) return cached;

      // 2. Fetch from Supabase
      const { data, error } = await (supabase.from as any)("game_content")
        .select("content, difficulty, category")
        .eq("game_id", gameId)
        .eq("content_type", contentType)
        .eq("is_active", true);

      if (error || !data || data.length === 0) {
        // 3. Static fallback
        return options?.fallback || [];
      }

      // Extract content — the content field is JSONB with lang keys
      const items: T[] = data.map((row: any) => {
        const content = row.content;
        // Content can be: { de: {...}, en: {...} } or flat { term: "...", ... }
        const localized = content[lang] || content.de || content;
        return {
          ...localized,
          difficulty: row.difficulty || localized.difficulty,
          category: row.category || localized.category,
        } as T;
      }).filter((item: any) => {
        // Filter out empty/invalid items
        if (!item) return false;
        const keys = Object.keys(item);
        return keys.length > 0;
      });

      if (items.length > 0) {
        writeLocalCache(cacheKey, items, lang);
      }

      return items.length > 0 ? items : (options?.fallback || []);
    },
    staleTime: STALE_TIME,
    gcTime: 30 * 60 * 1000, // 30 min garbage collection
    enabled: options?.enabled !== false,
    placeholderData: () => {
      // Use localStorage as placeholder while fetching
      return readLocalCache<T>(cacheKey, lang) || options?.fallback || [];
    },
  });
}

/**
 * Prefetch game content into cache (call on app startup or game hub).
 */
export function usePrefetchGameContent() {
  const queryClient = useQueryClient();
  const lang = i18n.language?.split("-")[0] || "de";

  return async (gameId: string, contentType: string) => {
    await queryClient.prefetchQuery({
      queryKey: ["game-content-cached", gameId, contentType, lang],
      queryFn: async () => {
        const cacheKey = getCacheKey(gameId, contentType, lang);
        const cached = readLocalCache(cacheKey, lang);
        if (cached && cached.length > 0) return cached;

        const { data } = await (supabase.from as any)("game_content")
          .select("content, difficulty, category")
          .eq("game_id", gameId)
          .eq("content_type", contentType)
          .eq("is_active", true);

        if (!data || data.length === 0) return [];

        const items = data.map((row: any) => {
          const content = row.content;
          const localized = content[lang] || content.de || content;
          return { ...localized, difficulty: row.difficulty, category: row.category };
        });

        if (items.length > 0) writeLocalCache(cacheKey, items, lang);
        return items;
      },
      staleTime: STALE_TIME,
    });
  };
}

/**
 * Clear all game content caches (after admin edits).
 */
export function clearGameContentCache() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("eb.gc."));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
