/**
 * query-builder — baut die Filter für die Inhaltsliste, rein und testbar.
 *
 * Alle Filter laufen auf dem SERVER (vorher wurden sie nach dem Blättern im
 * Browser angewendet, dadurch stimmten Trefferzahl und Seiten nicht).
 *
 * PostgREST-Syntax für JSONB: `content->de->>question` ist der Text-Wert,
 * `ilike` nimmt `*` als Platzhalter. Werte mit Komma/Klammern müssen in
 * Anführungszeichen stehen — deshalb quoten wir jeden Suchwert.
 */
import { LANG_CODES } from './field-configs';

export type ActiveFilter = 'all' | 'active' | 'inactive';

export interface ContentQueryParams {
  dbGameId: string;
  contentType: string;
  search?: string;
  /** Sprachen, in denen gesucht wird. Standard: Deutsch. */
  searchLangs?: readonly string[];
  /** Felder, in denen gesucht wird (Schlüssel im Sprachobjekt). Leer = ganzes Sprachobjekt. */
  searchFields?: readonly string[];
  difficulty?: string;
  category?: string;
  active?: ActiveFilter;
  /** Nur Einträge, denen diese Sprache fehlt. */
  missingLang?: string;
  page?: number;
  pageSize?: number;
}

export type FilterOp =
  | { op: 'eq'; column: string; value: string | boolean }
  | { op: 'or'; expr: string };

export const DEFAULT_PAGE_SIZE = 25;

/** Entfernt, was in einem `ilike`-Muster oder im Quoting stört. */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[%*\\"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function isSafeKey(key: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(key);
}

/** `or(...)`-Ausdruck für die Volltextsuche; `null`, wenn es nichts zu suchen gibt. */
export function buildSearchExpr(
  term: string,
  langs: readonly string[] = ['de'],
  fields: readonly string[] = [],
  includeCategory = true,
): string | null {
  const clean = sanitizeSearchTerm(term);
  if (!clean) return null;
  const pattern = `"*${clean}*"`;
  const safeLangs = [...new Set(langs)].filter((l) => LANG_CODES.includes(l));
  const useLangs = safeLangs.length > 0 ? safeLangs : ['de'];
  const safeFields = fields.filter(isSafeKey);
  const parts: string[] = [];
  for (const lang of useLangs) {
    if (safeFields.length === 0) parts.push(`content->>${lang}.ilike.${pattern}`);
    else for (const f of safeFields) parts.push(`content->${lang}->>${f}.ilike.${pattern}`);
  }
  if (includeCategory) parts.push(`category.ilike.${pattern}`);
  return parts.join(',');
}

/** Sprache fehlt: Schlüssel nicht vorhanden oder leeres Objekt. */
export function buildMissingLangExpr(lang: string): string | null {
  if (!LANG_CODES.includes(lang)) return null;
  return `content->>${lang}.is.null,content->>${lang}.eq."{}"`;
}

export function buildFilterOps(p: ContentQueryParams): FilterOp[] {
  const ops: FilterOp[] = [
    { op: 'eq', column: 'game_id', value: p.dbGameId },
    { op: 'eq', column: 'content_type', value: p.contentType },
  ];
  if (p.difficulty) ops.push({ op: 'eq', column: 'difficulty', value: p.difficulty });
  if (p.category) ops.push({ op: 'eq', column: 'category', value: p.category });
  if (p.active === 'active') ops.push({ op: 'eq', column: 'is_active', value: true });
  if (p.active === 'inactive') ops.push({ op: 'eq', column: 'is_active', value: false });
  const search = p.search ? buildSearchExpr(p.search, p.searchLangs, p.searchFields) : null;
  if (search) ops.push({ op: 'or', expr: search });
  const missing = p.missingLang ? buildMissingLangExpr(p.missingLang) : null;
  if (missing) ops.push({ op: 'or', expr: missing });
  return ops;
}

export function pageRange(page = 0, pageSize = DEFAULT_PAGE_SIZE): [number, number] {
  const p = Math.max(0, Math.floor(page));
  const size = Math.max(1, Math.floor(pageSize));
  return [p * size, p * size + size - 1];
}

export function pageCount(total: number, pageSize = DEFAULT_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

/** Minimale Form eines PostgREST-Filter-Builders — damit diese Datei ohne Supabase-Typen auskommt. */
export interface FilterChain<T> {
  eq(column: string, value: string | boolean): T;
  or(filters: string): T;
}

export function applyFilterOps<T extends FilterChain<T>>(query: T, ops: readonly FilterOp[]): T {
  let q = query;
  for (const op of ops) q = op.op === 'eq' ? q.eq(op.column, op.value) : q.or(op.expr);
  return q;
}
