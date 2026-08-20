/**
 * CLOSE ENOUGH — geteilte Grundlage von Spiel und Adminbereich.
 *
 * Hier stehen die Konstanten, die in der Datenbank als CHECK-Constraint
 * festgeschrieben sind: sieben Kategorien, 27 Einheiten, 42 Fragerahmen. Wer
 * sie in jeder Datei neu tippt, hat sie irgendwann in zwei Fassungen — und die
 * Adminseite bietet dann eine Einheit an, die das INSERT ablehnt.
 *
 * Der FRAGETEXT steht nicht in der Datenbank. Gespeichert sind Vorlagen-
 * schlüssel und Name je Sprache; der Satz entsteht erst beim Rendern über
 * `games.closeenough.frames.<frame_key>`. Eine neue Frage kostet damit null
 * Übersetzungsaufwand — nur einen Namen, den Wikidata ohnehin zehnsprachig
 * führt.
 */
import type { TFunction } from 'i18next';
import { formatNumber, formatYear } from './number-format';

// ---------------------------------------------------------------------------
// Kategorien
// ---------------------------------------------------------------------------

export const CE_CATEGORIES = [
  'laender',
  'bauwerke',
  'natur',
  'tierwelt',
  'sport',
  'technik',
  'alltag',
] as const;

export type CeCategory = (typeof CE_CATEGORIES)[number];

export function categoryLabelKey(c: CeCategory): string {
  return `games.closeenough.categories.${c}`;
}

// ---------------------------------------------------------------------------
// Einheiten
// ---------------------------------------------------------------------------

/**
 * Wie eine Einheit hinter der Zahl erscheint.
 *
 *  - `symbol` — angehängtes Kürzel: „1.141 m", „230 V". Nicht flektiert.
 *  - `word`   — ausgeschriebenes Wort mit Pluralform: „6 Millionen Besucher".
 *  - `none`   — gar nichts. Gilt allein für Jahreszahlen: „1889 Jahre" wäre
 *               schlicht falsch, gemeint ist das Jahr 1889.
 */
export type UnitDisplay = 'symbol' | 'word' | 'none';

export const CE_UNITS: Record<string, UnitDisplay> = {
  // Maßeinheiten — Kürzel, in allen zehn Sprachen weitgehend gleich.
  m: 'symbol',
  km: 'symbol',
  cm: 'symbol',
  km2: 'symbol',
  kg: 'symbol',
  t: 'symbol',
  kmh: 'symbol',
  m3s: 'symbol',
  volt: 'symbol',
  percent: 'symbol',
  liter: 'symbol',
  usd: 'symbol',
  mrd_usd: 'symbol',
  mio_eur: 'symbol',
  // Zählgrößen — ausgeschrieben, sonst stünde da „6000000 people".
  people: 'word',
  seats: 'word',
  floors: 'word',
  pieces: 'word',
  members: 'word',
  goals: 'word',
  matches: 'word',
  years: 'word',
  steps: 'word',
  beats: 'word',
  times: 'word',
  count: 'word',
  // Jahreszahl.
  year: 'none',
};

export const CE_UNIT_KEYS = Object.keys(CE_UNITS);

/**
 * Pluralform der Einheit in der Sprache des Spielers.
 *
 * Bewusst über `Intl.PluralRules` und EIGENE Schlüssel statt über die
 * Pluralbehandlung von i18next: Fehlt dort eine Form, liefert i18next den
 * rohen Schlüssel zurück und im Spiel steht „6 games.closeenough.units…".
 * Hier fällt eine fehlende Form still auf `other` zurück, und das ist in
 * jeder Sprache eine brauchbare Näherung.
 */
export function unitWord(unitKey: string, value: number, lang: string, t: TFunction): string {
  let category = 'other';
  try {
    category = new Intl.PluralRules(lang).select(Math.abs(value));
  } catch {
    // Unbekannter Sprachcode — `other` ist die sichere Wahl.
  }
  const base = `games.closeenough.units.${unitKey}`;
  const exact = t(`${base}.${category}`);
  if (exact && exact !== `${base}.${category}`) return exact;
  const fallback = t(`${base}.other`);
  return fallback && fallback !== `${base}.other` ? fallback : '';
}

/** Einheitenkürzel („m", „km²", „%"). */
export function unitSymbol(unitKey: string, t: TFunction): string {
  const key = `games.closeenough.units.${unitKey}.symbol`;
  const v = t(key);
  return v && v !== key ? v : '';
}

/**
 * Eine Antwort so ausgeben, wie sie zu ihrer Einheit passt.
 *
 * Der einzige Sonderfall ist die Jahreszahl — sie bekommt keinen
 * Tausenderpunkt. Alles andere wird normal gruppiert.
 */
export function formatAnswer(value: number, unitKey: string, lang = 'de'): string {
  return unitKey === 'year' ? formatYear(value, lang) : formatNumber(value, lang, 2);
}

/** Zahl und Einheit zu einer Zeile verbinden. */
export function withUnit(
  formatted: string,
  unitKey: string,
  value: number,
  lang: string,
  t: TFunction,
): string {
  const display = CE_UNITS[unitKey] ?? 'word';
  if (display === 'none') return formatted;
  if (display === 'symbol') {
    const sym = unitSymbol(unitKey, t);
    return sym ? `${formatted} ${sym}` : formatted;
  }
  const word = unitWord(unitKey, value, lang, t);
  return word ? `${formatted} ${word}` : formatted;
}

// ---------------------------------------------------------------------------
// Fragerahmen
// ---------------------------------------------------------------------------

/** Sentinel für handverlesene Fragen, deren Satz komplett gespeichert ist. */
export const CUSTOM_FRAME = 'custom';

/** Spiegelt `closeenough_frame_key_check` aus der Migration. */
export const FRAME_KEY_RE = /^[a-z][a-z0-9_]{2,39}$/;

export interface CeFrameDef {
  /** Vorgeschlagene Einheit — die Adminseite füllt damit das Formular vor. */
  unit: string;
  /** Vorgeschlagene Toleranz in Prozent. */
  tol: number;
  /** Größe verändert sich über die Zeit → Bezugsjahr gehört in den Fragetext. */
  needsDate?: boolean;
  category: CeCategory;
}

/**
 * Alle 42 Rahmen, gespiegelt aus `scripts/lib/closeenough-frames.mjs`.
 *
 * Die `tol`-Werte der Jahresrahmen stehen bei 0,15 % und nicht bei 3 %: Drei
 * Prozent von 1889 sind ±57 Jahre, der Volltreffer-Bonus wäre bei jeder
 * Jahresfrage geschenkt gewesen.
 */
export const CE_FRAMES: Record<string, CeFrameDef> = {
  // Länder & Städte
  population: { unit: 'people', tol: 15, needsDate: true, category: 'laender' },
  area: { unit: 'km2', tol: 15, category: 'laender' },
  gdp: { unit: 'mrd_usd', tol: 25, needsDate: true, category: 'laender' },
  gdp_per_capita: { unit: 'usd', tol: 20, needsDate: true, category: 'laender' },
  life_expectancy: { unit: 'years', tol: 5, needsDate: true, category: 'laender' },
  speakers: { unit: 'people', tol: 25, category: 'laender' },
  mains_voltage: { unit: 'volt', tol: 5, category: 'laender' },
  unemployment: { unit: 'percent', tol: 20, needsDate: true, category: 'laender' },
  // Bauwerke
  height_structure: { unit: 'm', tol: 10, category: 'bauwerke' },
  built_year: { unit: 'year', tol: 0.15, category: 'bauwerke' },
  floors: { unit: 'floors', tol: 10, category: 'bauwerke' },
  visitors_year: { unit: 'people', tol: 25, needsDate: true, category: 'bauwerke' },
  cost_project: { unit: 'mio_eur', tol: 30, category: 'bauwerke' },
  length_object: { unit: 'm', tol: 10, category: 'bauwerke' },
  diameter: { unit: 'm', tol: 12, category: 'bauwerke' },
  // Natur
  height_mountain: { unit: 'm', tol: 8, category: 'natur' },
  length_river: { unit: 'km', tol: 10, category: 'natur' },
  discharge: { unit: 'm3s', tol: 30, category: 'natur' },
  basin_area: { unit: 'km2', tol: 25, category: 'natur' },
  height_waterfall: { unit: 'm', tol: 10, category: 'natur' },
  depth: { unit: 'm', tol: 15, category: 'natur' },
  // Tierwelt
  mass_animal: { unit: 'kg', tol: 25, category: 'tierwelt' },
  length_animal: { unit: 'cm', tol: 20, category: 'tierwelt' },
  height_animal: { unit: 'cm', tol: 15, category: 'tierwelt' },
  wingspan_animal: { unit: 'cm', tol: 15, category: 'tierwelt' },
  speed_animal: { unit: 'kmh', tol: 20, category: 'tierwelt' },
  // Sport
  capacity_seats: { unit: 'seats', tol: 10, category: 'sport' },
  founded_year: { unit: 'year', tol: 0.15, category: 'sport' },
  members: { unit: 'members', tol: 25, needsDate: true, category: 'sport' },
  goals: { unit: 'goals', tol: 15, category: 'sport' },
  matches: { unit: 'matches', tol: 15, category: 'sport' },
  body_height: { unit: 'cm', tol: 4, category: 'sport' },
  track_length: { unit: 'm', tol: 8, category: 'sport' },
  participants: { unit: 'people', tol: 20, category: 'sport' },
  // Technik & Weltraum
  released_year: { unit: 'year', tol: 0.15, category: 'technik' },
  units_produced: { unit: 'pieces', tol: 30, category: 'technik' },
  speed_vehicle: { unit: 'kmh', tol: 12, category: 'technik' },
  range: { unit: 'km', tol: 20, category: 'technik' },
  mass_object: { unit: 't', tol: 20, category: 'technik' },
  wingspan_aircraft: { unit: 'm', tol: 10, category: 'technik' },
  employees: { unit: 'people', tol: 25, needsDate: true, category: 'technik' },
  revenue: { unit: 'mrd_usd', tol: 25, needsDate: true, category: 'technik' },
};

export const CE_FRAME_KEYS = Object.keys(CE_FRAMES);

// ---------------------------------------------------------------------------
// Fragen laden
// ---------------------------------------------------------------------------

export interface CeQuestion {
  id: string;
  frameKey: string;
  /** Name des Gegenstands in der aktiven Sprache, füllt das `{{name}}`. */
  name: string;
  /** Name auf Deutsch — nur für den Selbstverrats-Abgleich der Anker. */
  nameDe: string;
  /** Vollständiger Satz. Nur bei `frameKey === 'custom'` gesetzt. */
  question: string | null;
  answer: number;
  unitKey: string;
  category: CeCategory;
  tolerancePct: number;
  asOfYear: number | null;
  difficulty: number;
  sourceLabel: string;
  sourceUrl: string | null;
}

interface Row {
  id: string;
  name_i18n: Record<string, string> | null;
  question_i18n: Record<string, string> | null;
  frame_key: string;
  answer: number | string;
  unit_key: string;
  category: string;
  tolerance_pct: number | string;
  as_of_year: number | null;
  difficulty: number | null;
  source_label: string;
  source_url: string | null;
}

/**
 * Zugriff auf die Tabelle — der Client wird ERST HIER geladen.
 *
 * Ein `import { supabase }` am Dateikopf zöge den gesamten Datenbank-Client in
 * jeden Aufrufer, der eigentlich nur die Konstanten braucht: die Adminseite,
 * die Fernsehansicht, die Tests. Der Client greift beim Laden auf
 * `localStorage` zu und fällt damit überall um, wo es keinen Browser gibt.
 *
 * Die generierten Supabase-Typen hinken frischen Migrationen hinterher —
 * gleiche Umgehung wie in OhrwurmSongs.tsx und pixeljagd-extra.ts.
 */
async function table() {
  const { supabase } = await import('@/integrations/supabase/client');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from as never as (t: string) => any)('closeenough_questions');
}

/** Supabase deckelt die REST-API projektweit bei 1000 Zeilen. */
const PAGE = 1000;

function isCategory(c: string): c is CeCategory {
  return (CE_CATEGORIES as readonly string[]).includes(c);
}

/**
 * Fragen für eine Sprache laden.
 *
 * `languages` enthält entweder die Sprachcodes oder `'*'` für „alle zehn" —
 * gleiche Semantik wie bei `ohrwurm_songs`. Abgefragt wird mit `overlaps`,
 * das serverseitig zum `&&`-Operator wird und damit auf den GIN-Index geht.
 *
 * Seitenweise, nicht mit `.limit()`: Supabase deckelt die REST-API projektweit
 * bei 1000 Zeilen. Bei den 864 Fragen ginge das heute noch gut, beim nächsten
 * Import fehlten still welche.
 */
export async function loadQuestions(
  lang: string,
  categories?: CeCategory[],
): Promise<CeQuestion[]> {
  const out: CeQuestion[] = [];
  try {
    for (let from = 0; ; from += PAGE) {
      let q = (await table())
        .select(
          'id,name_i18n,question_i18n,frame_key,answer,unit_key,category,tolerance_pct,as_of_year,difficulty,source_label,source_url',
        )
        .eq('is_active', true)
        .overlaps('languages', [lang, '*']);
      if (categories?.length) q = q.in('category', categories);

      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error) break;
      const chunk = (data ?? []) as Row[];

      for (const r of chunk) {
        const mapped = toQuestion(r, lang);
        if (mapped) out.push(mapped);
      }
      if (chunk.length < PAGE) break;
    }
  } catch {
    // Ohne Fragen zeigt die Einrichtung den Hinweis „keine Fragen verfügbar".
  }
  return out;
}

/**
 * Eine Datenbankzeile in eine spielbare Frage wandeln.
 *
 * `Number(r.answer)` ist der Punkt, an dem es still schiefginge: supabase-js
 * liefert `numeric` je nach Größe als String. Ohne die Wandlung verglichen
 * `Math.abs(guess - truth)` und die Rangfolge Zeichenketten — nichts stürzt
 * ab, die Wertung wäre nur Unsinn.
 */
function toQuestion(r: Row, lang: string): CeQuestion | null {
  const answer = Number(r.answer);
  if (!Number.isFinite(answer)) return null;
  if (!isCategory(r.category)) return null;

  const names = r.name_i18n ?? {};
  const questions = r.question_i18n ?? {};
  const custom = r.frame_key === CUSTOM_FRAME;

  // Deutsch als Rückfallebene: Die Pipeline garantiert `de`, alle anderen
  // Sprachen sind bei Wikidata gelegentlich lückenhaft.
  const name = (names[lang] ?? names.de ?? '').trim();
  const question = custom ? (questions[lang] ?? questions.de ?? '').trim() : '';

  if (custom ? !question : !name) return null;

  const tolerance = Number(r.tolerance_pct);

  return {
    id: r.id,
    frameKey: r.frame_key,
    name,
    nameDe: (names.de ?? '').trim(),
    question: question || null,
    answer,
    unitKey: r.unit_key,
    category: r.category,
    tolerancePct: Number.isFinite(tolerance) && tolerance > 0 ? tolerance : 10,
    asOfYear: r.as_of_year ?? null,
    difficulty: r.difficulty ?? 2,
    sourceLabel: r.source_label,
    sourceUrl: r.source_url,
  };
}

/**
 * Den Fragesatz zusammensetzen.
 *
 * Bei zeitabhängigen Größen hängt das Bezugsjahr an — ohne das wirkt jede
 * richtige Antwort falsch, weil der Spieler eine andere Jahresangabe im Kopf
 * hat.
 */
export function questionText(q: CeQuestion, t: TFunction): string {
  const base = q.question ?? t(`games.closeenough.frames.${q.frameKey}`, { name: q.name });
  if (!q.asOfYear) return base;
  return `${base} ${t('games.closeenough.asOf', { year: q.asOfYear })}`;
}
