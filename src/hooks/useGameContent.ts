/**
 * useGameContent — Datenzugriff des Admin-Bereichs "Games Content" auf die
 * Tabelle `game_content`.
 *
 * `game_content` fehlt in den generierten Supabase-Typen
 * (src/integrations/supabase/types.ts). Statt den Client auf `any` zu casten,
 * gibt es hier GENAU EINE schmale, getypte Sicht auf diese eine Tabelle
 * (`contentTable()`); alles andere in dieser Datei ist normal getypt.
 *
 * Suche, Filter, Blättern und Zählen laufen auf dem Server (siehe
 * `query-builder.ts`), damit Trefferzahl und Seiten stimmen.
 */
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearGameContentCache } from './useGameContentCached';
import {
  buildFilterOps, pageRange, DEFAULT_PAGE_SIZE, type ContentQueryParams,
} from '@/components/admin/games/query-builder';
import { pairKey, type ContentPair } from '@/components/admin/games/game-registry';

export type ContentJson = Record<string, Record<string, string>>;

export type GameContentRow = {
  id: string;
  game_id: string;
  content_type: string;
  content: ContentJson;
  difficulty: string | null;
  category: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type GameContentInsert = {
  game_id: string;
  content_type: string;
  content: ContentJson;
  difficulty?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_active?: boolean | null;
  created_by?: string | null;
  updated_at?: string | null;
};

type GameContentDatabase = {
  public: {
    Tables: {
      game_content: {
        Row: GameContentRow;
        Insert: GameContentInsert;
        Update: Partial<GameContentInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** Die eine schmale, getypte Sicht auf `game_content`. */
function contentTable() {
  return (supabase as unknown as SupabaseClient<GameContentDatabase>).from('game_content');
}

const ROW_COLUMNS = 'id, game_id, content_type, content, difficulty, category, tags, is_active, created_by, created_at, updated_at';
const WRITE_CHUNK = 100;
const READ_CHUNK = 1000;
const QUERY_ROOT = 'admin-game-content';

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ─── Lesen ───────────────────────────────────────────────────────

export interface ContentPage {
  rows: GameContentRow[];
  total: number;
}

export async function fetchContentPage(params: ContentQueryParams): Promise<ContentPage> {
  let query = contentTable().select(ROW_COLUMNS, { count: 'exact' });
  for (const op of buildFilterOps(params)) {
    // `filter` statt `eq`: die Spalte kommt als Text aus dem Query-Builder.
    query = op.op === 'eq' ? query.filter(op.column, 'eq', op.value) : query.or(op.expr);
  }
  const [from, to] = pageRange(params.page, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .range(from, to);
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0 };
}

async function countWhere(dbId?: string, contentType?: string): Promise<number> {
  let query = contentTable().select('id', { count: 'exact', head: true });
  if (dbId) query = query.eq('game_id', dbId);
  if (contentType) query = query.eq('content_type', contentType);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export interface ContentCounts {
  /** Schlüssel: `pairKey(dbId, contentType)`. */
  byPair: Record<string, number>;
  /** Alle Zeilen der Tabelle — auch solche unter Kennungen, die kein Spiel mehr hat. */
  total: number;
}

export async function fetchContentCounts(pairs: readonly ContentPair[]): Promise<ContentCounts> {
  const [total, ...counts] = await Promise.all([
    countWhere(),
    ...pairs.map((p) => countWhere(p.dbId, p.contentType)),
  ]);
  const byPair: Record<string, number> = {};
  pairs.forEach((p, i) => { byPair[pairKey(p.dbId, p.contentType)] = counts[i]; });
  return { byPair, total };
}

/** Alle Zeilen eines Paars, seitenweise gegen den 1000-Zeilen-Deckel von PostgREST. */
export async function fetchAllForPair(
  dbId: string,
  contentType: string,
): Promise<Pick<GameContentRow, 'id' | 'content' | 'category'>[]> {
  const out: Pick<GameContentRow, 'id' | 'content' | 'category'>[] = [];
  for (let from = 0; ; from += READ_CHUNK) {
    const { data, error } = await contentTable()
      .select('id, content, category')
      .eq('game_id', dbId)
      .eq('content_type', contentType)
      .order('id', { ascending: true })
      .range(from, from + READ_CHUNK - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < READ_CHUNK) return out;
  }
}

// ─── Schreiben ───────────────────────────────────────────────────

export interface WriteResult {
  ok: number;
  failed: number;
  firstError?: string;
}

export async function insertContent(rows: readonly GameContentInsert[]): Promise<WriteResult> {
  const { data: auth } = await supabase.auth.getUser();
  const createdBy = auth.user?.id ?? null;
  const result: WriteResult = { ok: 0, failed: 0 };
  for (const part of chunk(rows, WRITE_CHUNK)) {
    const { error } = await contentTable().insert(part.map((r) => ({ ...r, created_by: createdBy })));
    if (error) {
      result.failed += part.length;
      result.firstError ??= error.message;
    } else result.ok += part.length;
  }
  clearGameContentCache();
  return result;
}

/** Legt EINEN Eintrag an und gibt ihn zurück (für "Rückgängig" braucht es die id). */
export async function insertContentRow(row: GameContentInsert): Promise<GameContentRow> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await contentTable()
    .insert({ ...row, created_by: auth.user?.id ?? null })
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  clearGameContentCache();
  return data;
}

export async function updateContent(id: string, patch: Partial<GameContentInsert>): Promise<void> {
  const { error } = await contentTable()
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  clearGameContentCache();
}

export async function setContentActive(ids: readonly string[], isActive: boolean): Promise<void> {
  for (const part of chunk(ids, WRITE_CHUNK)) {
    const { error } = await contentTable()
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .in('id', part);
    if (error) throw new Error(error.message);
  }
  clearGameContentCache();
}

export async function deleteContent(ids: readonly string[]): Promise<void> {
  for (const part of chunk(ids, WRITE_CHUNK)) {
    const { error } = await contentTable().delete().in('id', part);
    if (error) throw new Error(error.message);
  }
  clearGameContentCache();
}

/**
 * Löscht alle Zeilen EINES Paars. Bewusst gibt es keine Funktion ohne beide
 * Filter — der alte "alles löschen"-Pfad ist damit nicht mehr ausdrückbar.
 */
export async function deleteAllForPair(dbId: string, contentType: string): Promise<void> {
  if (!dbId || !contentType) throw new Error('game_id and content_type are required');
  const { error } = await contentTable().delete().eq('game_id', dbId).eq('content_type', contentType);
  if (error) throw new Error(error.message);
  clearGameContentCache();
}

// ─── Hooks ───────────────────────────────────────────────────────

export function useContentPage(params: ContentQueryParams, enabled = true) {
  return useQuery({
    queryKey: [QUERY_ROOT, 'page', params],
    queryFn: () => fetchContentPage(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 30_000,
  });
}

export function useContentCounts(pairs: readonly ContentPair[]) {
  return useQuery({
    queryKey: [QUERY_ROOT, 'counts', pairs.map((p) => pairKey(p.dbId, p.contentType))],
    queryFn: () => fetchContentCounts(pairs),
    staleTime: 60_000,
  });
}

/** Kategorien, die in der Datenbank für dieses Paar tatsächlich vorkommen. */
export function useContentCategories(dbId: string, contentType: string, enabled = true) {
  return useQuery({
    queryKey: [QUERY_ROOT, 'categories', dbId, contentType],
    queryFn: async () => {
      const rows = await fetchAllForPair(dbId, contentType);
      const set = new Set<string>();
      for (const r of rows) if (r.category) set.add(r.category);
      return [...set].sort((a, b) => a.localeCompare(b));
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Nach jedem Schreiben aufrufen: Listen, Zähler und Kategorien neu laden. */
export function useInvalidateContent() {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_ROOT] }),
    [queryClient],
  );
}
