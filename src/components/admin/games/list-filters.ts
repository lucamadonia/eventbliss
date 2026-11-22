/**
 * list-filters — Filterzustand der Inhaltsliste und seine Abbildung auf die
 * URL (`?q=…&state=…&diff=…&cat=…&missing=…&lang=…&page=…`), rein und testbar.
 * Gefiltert wird auf dem Server; hier stehen nur die Eingaben.
 */
import { BASE_LANG, LANG_CODES } from './field-configs';
import type { ActiveFilter } from './query-builder';

export interface ListFilters {
  search: string;
  difficulty: string;
  category: string;
  active: ActiveFilter;
  missingLang: string;
}

export const EMPTY_FILTERS: ListFilters = {
  search: '', difficulty: '', category: '', active: 'all', missingLang: '',
};

export interface ListState {
  filters: ListFilters;
  viewLang: string;
  /** Nullbasiert; in der URL steht die Seite einsbasiert. */
  page: number;
}

/** Wie viele Filter gerade wirken (die Anzeigesprache ist kein Filter). */
export function activeFilterCount(f: ListFilters): number {
  return [f.search.trim() !== '', f.difficulty !== '', f.category !== '', f.active !== 'all', f.missingLang !== '']
    .filter(Boolean).length;
}

export function hasActiveFilters(f: ListFilters): boolean {
  return activeFilterCount(f) > 0;
}

/** Schlüssel in der URL, die zur Liste gehören (nicht `game`/`type`). */
export const LIST_PARAM_KEYS = ['q', 'state', 'diff', 'cat', 'missing', 'lang', 'page'] as const;

export function listStateFromParams(params: URLSearchParams): ListState {
  const state = params.get('state');
  const missing = params.get('missing') ?? '';
  const lang = params.get('lang') ?? '';
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    filters: {
      search: params.get('q') ?? '',
      difficulty: params.get('diff') ?? '',
      category: params.get('cat') ?? '',
      active: state === 'active' || state === 'inactive' ? state : 'all',
      missingLang: LANG_CODES.includes(missing) ? missing : '',
    },
    viewLang: LANG_CODES.includes(lang) ? lang : BASE_LANG,
    page: Number.isFinite(page) && page > 1 ? page - 1 : 0,
  };
}

/** Schreibt den Listenzustand in eine Kopie der Parameter; Standardwerte stehen nicht in der URL. */
export function listStateToParams(base: URLSearchParams, s: ListState): URLSearchParams {
  const next = new URLSearchParams(base);
  const put = (key: string, value: string) => { if (value) next.set(key, value); else next.delete(key); };
  put('q', s.filters.search.trim());
  put('state', s.filters.active === 'all' ? '' : s.filters.active);
  put('diff', s.filters.difficulty);
  put('cat', s.filters.category);
  put('missing', s.filters.missingLang);
  put('lang', s.viewLang === BASE_LANG ? '' : s.viewLang);
  put('page', s.page > 0 ? String(s.page + 1) : '');
  return next;
}
