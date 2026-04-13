/**
 * dynamicLoader — loads game content from Supabase DB with localStorage cache,
 * falling back to static files when DB is empty or offline.
 *
 * Used by the game content wrappers (questions.ts, taboo-words.ts, headup-words.ts)
 * to transparently serve DB content when available.
 */
import { supabase } from "@/integrations/supabase/client";
import i18n from "i18next";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry<T> {
  data: T[];
  ts: number;
  lang: string;
}

function cacheKey(gameId: string, type: string, lang: string) {
  return `eb.gc.${gameId}.${type}.${lang}`;
}

function readCache<T>(key: string, lang: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const e: CacheEntry<T> = JSON.parse(raw);
    if (e.lang !== lang || Date.now() - e.ts > CACHE_TTL) return null;
    return e.data;
  } catch { return null; }
}

function writeCache<T>(key: string, data: T[], lang: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now(), lang }));
  } catch { /* full */ }
}

/**
 * Load content from DB → cache → static fallback.
 * Returns the content array or null if DB has nothing (caller uses static).
 */
export async function loadFromDB<T>(
  gameId: string,
  contentType: string,
): Promise<T[] | null> {
  const lang = i18n.language?.split("-")[0] || "de";
  const key = cacheKey(gameId, contentType, lang);

  // 1. localStorage cache
  const cached = readCache<T>(key, lang);
  if (cached && cached.length > 0) return cached;

  // 2. Supabase
  try {
    const { data, error } = await (supabase.from as any)("game_content")
      .select("content, difficulty, category")
      .eq("game_id", gameId)
      .eq("content_type", contentType)
      .eq("is_active", true);

    if (error || !data || data.length === 0) return null;

    const items: T[] = data.map((row: any) => {
      const c = row.content;
      const localized = c[lang] || c.de || c;
      return {
        ...localized,
        difficulty: row.difficulty || localized.difficulty,
        category: row.category || localized.category,
      } as T;
    }).filter(Boolean);

    if (items.length > 0) {
      writeCache(key, items, lang);
      return items;
    }
  } catch {
    // Offline or error — fall through to static
  }

  return null;
}

/**
 * Synchronous cache check — returns cached DB content or null.
 * Use this for sync game functions that can't await.
 */
export function loadFromCacheSync<T>(gameId: string, contentType: string): T[] | null {
  const lang = i18n.language?.split("-")[0] || "de";
  return readCache<T>(cacheKey(gameId, contentType, lang), lang);
}
