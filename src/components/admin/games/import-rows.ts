/**
 * import-rows — aus CSV/JSON-Text eine Vorschau bauen (rein, ohne Datenbank).
 * Erst nach der Vorschau wird irgendetwas geschrieben; übersprungene Zeilen
 * tragen einen Grund.
 */
import { parseCsv, stripBom, toCsv } from './csv';
import {
  BASE_LANG, LANG_CODES, asText, defaultDifficulty, fieldsFor, categorySuggestions, fixedCategoryIds, isLangFilled,
  type ContentMap, type FieldDef,
} from './field-configs';
import { hasErrors, normalizeContent, validateContent } from './validation';

export type SkipReason =
  | 'empty'
  | 'unknownLang'
  | 'missingBase'
  | 'required'
  | 'number'
  | 'range'
  | 'duplicateInFile'
  | 'duplicateInDb'
  | 'badCategory'
  | 'badJson';

export interface ImportItem {
  /** Zeilennummer in der Datei (1 = Kopfzeile bei CSV). */
  line: number;
  content: ContentMap;
  difficulty: string;
  category: string;
  is_active: boolean;
}

export interface SkippedRow {
  line: number;
  reason: SkipReason;
  detail?: string;
}

export interface ImportPreview {
  items: ImportItem[];
  skipped: SkippedRow[];
  totalRows: number;
  ignoredColumns: string[];
  fatal?: SkipReason;
}

const META_COLUMNS = new Set(['lang', 'difficulty', 'category', 'active', 'is_active']);

/** Schlüssel zum Erkennen von Dubletten: erster Pflicht-Text der Basissprache, klein geschrieben. */
export function primaryKey(contentType: string, content: ContentMap): string {
  const data = content[BASE_LANG];
  if (!data) return '';
  const first = fieldsFor(contentType).find((f) => f.required && f.type !== 'select');
  return first ? asText(data[first.key]).trim().toLowerCase() : '';
}

function coerceSelect(field: FieldDef, raw: string): string {
  const v = raw.trim();
  if (!field.options) return v;
  if (field.key === 'isTrue') {
    const l = v.toLowerCase();
    if (['true', 'wahr', 'ja', '1'].includes(l)) return '0';
    if (['false', 'falsch', 'nein', '0'].includes(l)) return '1';
  }
  const asIndex = Number(v);
  if (v !== '' && Number.isInteger(asIndex) && asIndex >= 0 && asIndex < field.options.length) return String(asIndex);
  const byLabel = field.options.findIndex((o) => o.toLowerCase() === v.toLowerCase());
  return byLabel >= 0 ? String(byLabel) : v;
}

function truthy(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === '') return true;
  return !['0', 'false', 'nein', 'no', 'inaktiv'].includes(raw.trim().toLowerCase());
}

interface FlatRow { line: number; values: Record<string, string> }

function rowsFromCsv(text: string): { rows: FlatRow[]; ignored: string[]; total: number } {
  const { rows } = parseCsv(text);
  if (rows.length < 2) return { rows: [], ignored: [], total: 0 };
  const header = rows[0].map((h) => h.trim());
  const out: FlatRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const values: Record<string, string> = {};
    header.forEach((h, idx) => { if (h) values[h] = (rows[i][idx] ?? '').trim(); });
    out.push({ line: i + 1, values });
  }
  return { rows: out, ignored: [], total: out.length };
}

type JsonRow = Record<string, unknown>;

function rowsFromJson(text: string): { rows: FlatRow[]; structured: Map<number, JsonRow>; total: number } | null {
  let parsed: unknown;
  try { parsed = JSON.parse(stripBom(text)); } catch { return null; }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const rows: FlatRow[] = [];
  const structured = new Map<number, JsonRow>();
  list.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') return;
    const obj = entry as JsonRow;
    const line = idx + 1;
    if (obj.content && typeof obj.content === 'object') structured.set(line, obj);
    else {
      const values: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj)) values[k] = asText(v);
      rows.push({ line, values });
    }
  });
  return { rows, structured, total: list.length };
}

export function buildImportPreview(
  text: string,
  format: 'csv' | 'json',
  contentType: string,
  opts: { existingKeys?: ReadonlySet<string>; defaultCategory?: string } = {},
): ImportPreview {
  const fields = fieldsFor(contentType);
  const fieldByLower = new Map(fields.map((f) => [f.key.toLowerCase(), f]));
  const skipped: SkippedRow[] = [];
  const items: ImportItem[] = [];
  const seen = new Set<string>();
  const ignored = new Set<string>();
  let flat: FlatRow[] = [];
  let structured = new Map<number, JsonRow>();
  let total = 0;

  if (format === 'csv') {
    const r = rowsFromCsv(text);
    flat = r.rows; total = r.total;
  } else {
    const r = rowsFromJson(text);
    if (!r) return { items: [], skipped: [], totalRows: 0, ignoredColumns: [], fatal: 'badJson' };
    flat = r.rows; structured = r.structured; total = r.total;
  }

  const accept = (line: number, content: ContentMap, difficulty: string, category: string, active: boolean) => {
    if (!isLangFilled(contentType, content[BASE_LANG])) return skipped.push({ line, reason: 'missingBase' });
    if (fixedCategories && !fixedCategories.includes(category)) {
      return skipped.push({ line, reason: 'badCategory', detail: category });
    }
    const errors = validateContent(contentType, content);
    if (hasErrors(errors)) {
      const [lang, fieldErrs] = Object.entries(errors)[0];
      const [fieldKey, code] = Object.entries(fieldErrs)[0];
      return skipped.push({ line, reason: code === 'required' ? 'required' : code, detail: `${lang}:${fieldKey}` });
    }
    const normalized = normalizeContent(contentType, content);
    const key = primaryKey(contentType, normalized);
    if (key && seen.has(key)) return skipped.push({ line, reason: 'duplicateInFile', detail: key });
    if (key && opts.existingKeys?.has(key)) return skipped.push({ line, reason: 'duplicateInDb', detail: key });
    if (key) seen.add(key);
    items.push({ line, content: normalized, difficulty, category, is_active: active });
  };

  const defCategory = opts.defaultCategory ?? categorySuggestions(contentType)[0] ?? 'general';
  const fixedCategories = fixedCategoryIds(contentType);

  for (const row of flat) {
    const content: ContentMap = {};
    const lang = (row.values.lang || BASE_LANG).trim().toLowerCase();
    if (!LANG_CODES.includes(lang)) { skipped.push({ line: row.line, reason: 'unknownLang', detail: lang }); continue; }
    const data: Record<string, string> = {};
    for (const [col, value] of Object.entries(row.values)) {
      const lower = col.toLowerCase();
      const f = fieldByLower.get(lower);
      if (f) { if (value !== '') data[f.key] = f.type === 'select' ? coerceSelect(f, value) : value; }
      else if (!META_COLUMNS.has(lower)) ignored.add(col);
    }
    content[lang] = data;
    if (Object.values(data).every((v) => v === '')) { skipped.push({ line: row.line, reason: 'empty' }); continue; }
    accept(
      row.line,
      content,
      row.values.difficulty || defaultDifficulty(contentType),
      row.values.category || defCategory,
      truthy(row.values.active ?? row.values.is_active),
    );
  }

  for (const [line, obj] of structured) {
    const content: ContentMap = {};
    for (const [lang, data] of Object.entries(obj.content as JsonRow)) {
      if (!LANG_CODES.includes(lang) || !data || typeof data !== 'object') continue;
      content[lang] = Object.fromEntries(Object.entries(data as JsonRow).map(([k, v]) => [k, asText(v)]));
    }
    accept(
      line,
      content,
      asText(obj.difficulty) || defaultDifficulty(contentType),
      asText(obj.category) || defCategory,
      obj.is_active !== false,
    );
  }

  skipped.sort((a, b) => a.line - b.line);
  items.sort((a, b) => a.line - b.line);
  return { items, skipped, totalRows: total, ignoredColumns: [...ignored] };
}

/** JSON beginnt mit `[` oder `{` — alles andere wird als CSV gelesen. */
export function detectFormat(text: string): 'csv' | 'json' {
  const first = stripBom(text).replace(/^\s+/, '').charAt(0);
  return first === '[' || first === '{' ? 'json' : 'csv';
}

/** CSV-Vorlage: Kopfzeile + eine Beispielzeile. */
export function buildTemplateCsv(contentType: string): string {
  const fields = fieldsFor(contentType);
  const header = ['lang', ...fields.map((f) => f.key), 'difficulty', 'category'];
  const example = [
    'de',
    ...fields.map((f) => (f.type === 'number' ? '0' : f.type === 'select' ? '0' : 'Beispiel')),
    defaultDifficulty(contentType),
    categorySuggestions(contentType)[0] ?? 'general',
  ];
  return String.fromCharCode(0xfeff) + toCsv([header, example]);
}
