/**
 * field-configs — Felder je Inhaltstyp, Sprachen, Schwierigkeiten, Kategorien.
 * Die Semantik der Felder ist die des bisherigen Admins (`FIELD_CONFIGS`):
 * Auswahlfelder speichern den Index als Text ('0', '1', ...), Listen
 * (Begriffe/Wörter) sind kommagetrennter Text.
 */

export const LANGS = [
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
] as const;

export type LangCode = (typeof LANGS)[number]['code'];
export const BASE_LANG: LangCode = 'de';
export const LANG_CODES: readonly string[] = LANGS.map((l) => l.code);

export interface FieldDef {
  key: string;
  label: string;
  desc: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
  /** Muss in der Basissprache (Deutsch) gefüllt sein. */
  required?: boolean;
}

export interface TypeConfig {
  label: string;
  fields: FieldDef[];
}

const answers = (prefix: string): FieldDef[] =>
  [1, 2, 3, 4].map((n) => ({
    key: `answer${n}`,
    label: `Antwort ${n}`,
    desc: `${prefix} ${n}`,
    type: 'text' as const,
    required: true,
  }));

export const FIELD_CONFIGS: Record<string, TypeConfig> = {
  question: { label: 'Quiz-Frage', fields: [
    { key: 'question', label: 'Frage', desc: 'Die Frage, die dem Spieler angezeigt wird', type: 'text', required: true },
    ...answers('Antwortmöglichkeit'),
    { key: 'correctIndex', label: 'Richtige Antwort', desc: 'Welche Antwort ist korrekt?', type: 'select', options: ['Antwort 1', 'Antwort 2', 'Antwort 3', 'Antwort 4'] },
  ] },
  category: { label: 'Kategorie', fields: [
    { key: 'name', label: 'Kategorie-Name', desc: 'z. B. "Tiere", "Länder", "Berufe"', type: 'text', required: true },
    { key: 'terms', label: 'Begriffe', desc: 'Kommagetrennte Begriffe, die in diese Kategorie passen', type: 'textarea', required: true },
  ] },
  taboo_card: { label: 'Tabu-Karte', fields: [
    { key: 'term', label: 'Zu erratender Begriff', desc: 'Das Wort, das erklärt werden muss', type: 'text', required: true },
    { key: 'forbidden1', label: 'Tabu-Wort 1', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text', required: true },
    { key: 'forbidden2', label: 'Tabu-Wort 2', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text', required: true },
    { key: 'forbidden3', label: 'Tabu-Wort 3', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
    { key: 'forbidden4', label: 'Tabu-Wort 4', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
    { key: 'forbidden5', label: 'Tabu-Wort 5', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
  ] },
  headup_word: { label: 'Stirnraten-Kategorie', fields: [
    { key: 'word', label: 'Kategorie', desc: 'z. B. "Prominente", "Tiere"', type: 'text', required: true },
    { key: 'words', label: 'Wörter', desc: 'Kommagetrennte Begriffe für diese Kategorie', type: 'textarea', required: true },
  ] },
  pantomime_word: { label: 'Pantomime-Begriff', fields: [
    { key: 'word', label: 'Begriff', desc: 'Der Begriff, der pantomimisch dargestellt wird. Die Kategorie legst du unten fest.', type: 'text', required: true },
  ] },
  emoji_puzzle: { label: 'Emoji-Rätsel', fields: [
    { key: 'emojis', label: 'Emojis', desc: 'Die Emoji-Kombination, z. B. "🧙‍♂️⚡📖"', type: 'text', required: true },
    { key: 'answer', label: 'Lösung', desc: 'Die richtige Antwort, z. B. "Harry Potter"', type: 'text', required: true },
  ] },
  fact: { label: 'Fakt', fields: [
    { key: 'statement', label: 'Aussage', desc: 'Eine Behauptung — wahr oder falsch?', type: 'textarea', required: true },
    { key: 'isTrue', label: 'Wahr oder Falsch?', desc: 'Ist die Aussage korrekt?', type: 'select', options: ['Wahr', 'Falsch'] },
    { key: 'explanation', label: 'Erklärung', desc: 'Kurze Erklärung, warum wahr/falsch', type: 'textarea' },
  ] },
  truth: { label: 'Wahrheit-Frage', fields: [
    { key: 'text', label: 'Frage', desc: 'Eine persönliche Frage, die ehrlich beantwortet werden muss', type: 'textarea', required: true },
    { key: 'intensity', label: 'Intensität', desc: '1 = harmlos, 2 = mittel, 3 = pikant', type: 'select', options: ['Harmlos', 'Mittel', 'Pikant'] },
  ] },
  dare: { label: 'Pflicht-Aufgabe', fields: [
    { key: 'text', label: 'Aufgabe', desc: 'Eine lustige oder herausfordernde Aufgabe', type: 'textarea', required: true },
    { key: 'intensity', label: 'Intensität', desc: '1 = harmlos, 2 = mittel, 3 = wild', type: 'select', options: ['Harmlos', 'Mittel', 'Wild'] },
  ] },
  pair: { label: 'This or That', fields: [
    { key: 'optionA', label: 'Option A', desc: 'Erste Auswahlmöglichkeit', type: 'text', required: true },
    { key: 'optionB', label: 'Option B', desc: 'Zweite Auswahlmöglichkeit', type: 'text', required: true },
  ] },
  character: { label: 'Charakter', fields: [
    { key: 'name', label: 'Name', desc: 'Name der Person/Figur, z. B. "Albert Einstein"', type: 'text', required: true },
  ] },
  bottle_card: { label: 'Flaschen-Karte', fields: [
    { key: 'text', label: 'Text', desc: 'Die Frage oder Aufgabe auf der Karte', type: 'textarea', required: true },
    { key: 'type', label: 'Typ', desc: 'Art der Karte', type: 'select', options: ['Frage', 'Aufgabe', 'Trinkspiel', 'Lustig'] },
  ] },
  prompt: { label: 'Story-Prompt', fields: [
    { key: 'text', label: 'Prompt', desc: 'Eine kreative Aufforderung für die Geschichte', type: 'textarea', required: true },
  ] },
  starter: { label: 'Story-Starter', fields: [
    { key: 'text', label: 'Starter-Satz', desc: 'Der erste Satz einer Geschichte, z. B. "Es war einmal..."', type: 'textarea', required: true },
  ] },
  shared_question: { label: 'Geteilte Frage', fields: [
    { key: 'question', label: 'Frage', desc: 'Die Quiz-Frage', type: 'text', required: true },
    ...answers('Antwort'),
    { key: 'correctIndex', label: 'Richtige Antwort', desc: 'Welche ist korrekt?', type: 'select', options: ['1', '2', '3', '4'] },
    { key: 'hint', label: 'Hinweis', desc: 'Optionaler Tipp für die Spieler', type: 'text' },
  ] },
  draw_word: { label: 'Zeichenwort', fields: [
    { key: 'word', label: 'Wort', desc: 'Das zu zeichnende Wort', type: 'text', required: true },
  ] },
  word_set: { label: 'Wort-Set', fields: [
    { key: 'word', label: 'Wort', desc: 'Das geheime Wort', type: 'text', required: true },
    { key: 'category', label: 'Kategorie', desc: 'Kategorie-Hinweis für Spieler', type: 'text' },
  ] },
  location: { label: 'Ort', fields: [
    { key: 'name', label: 'Name', desc: 'Name des Ortes', type: 'text', required: true },
    { key: 'lat', label: 'Breitengrad', desc: 'GPS Latitude, z. B. 48.1351', type: 'number', required: true },
    { key: 'lng', label: 'Längengrad', desc: 'GPS Longitude, z. B. 11.5820', type: 'number', required: true },
    { key: 'type', label: 'Typ', desc: 'z. B. Stadt, Natur, Sehenswürdigkeit', type: 'text' },
  ] },
};

export const FALLBACK_FIELDS: FieldDef[] = [
  { key: 'text', label: 'Text', desc: '', type: 'text', required: true },
];

export function fieldsFor(contentType: string): FieldDef[] {
  return FIELD_CONFIGS[contentType]?.fields ?? FALLBACK_FIELDS;
}

export function typeLabel(contentType: string): string {
  return FIELD_CONFIGS[contentType]?.label ?? contentType;
}

// ─── Schwierigkeit & Kategorien ──────────────────────────────────

const TONE_LOW = 'border-border bg-secondary text-secondary-foreground';
const TONE_MID = 'border-primary/30 bg-primary/10 text-primary';
const TONE_HIGH = 'border-destructive/30 bg-destructive/10 text-destructive';

export const NAMED_DIFFICULTIES = [
  { value: 'easy', label: 'Leicht', tone: TONE_LOW },
  { value: 'medium', label: 'Mittel', tone: TONE_MID },
  { value: 'hard', label: 'Schwer', tone: TONE_HIGH },
] as const;

export const NUMERIC_DIFFICULTIES = [
  { value: '1', label: '1', tone: TONE_LOW },
  { value: '2', label: '2', tone: TONE_MID },
  { value: '3', label: '3', tone: TONE_HIGH },
] as const;

/** Diese Spiele speichern die Schwierigkeit als Zahl (so hat sie der alte Import angelegt). */
const NUMERIC_DIFFICULTY_TYPES = new Set(['truth', 'dare', 'emoji_puzzle', 'draw_word']);

export function difficultiesFor(contentType: string): ReadonlyArray<{ value: string; label: string; tone: string }> {
  return NUMERIC_DIFFICULTY_TYPES.has(contentType) ? NUMERIC_DIFFICULTIES : NAMED_DIFFICULTIES;
}

export function difficultyTone(value: string): string {
  const all = [...NAMED_DIFFICULTIES, ...NUMERIC_DIFFICULTIES];
  return all.find((d) => d.value === value)?.tone ?? 'text-muted-foreground bg-muted border-border';
}

export function difficultyLabel(value: string): string {
  return NAMED_DIFFICULTIES.find((d) => d.value === value)?.label ?? value;
}

export function defaultDifficulty(contentType: string): string {
  return NUMERIC_DIFFICULTY_TYPES.has(contentType) ? '1' : 'medium';
}

/** Bei Pantomime ist die Kategorie die Kennung einer App-Kategorie — kein Freitext. */
export const PANTOMIME_CATEGORY_IDS = [
  'tiere', 'berufe', 'filme', 'alltag', 'sport', 'gefuehle', 'sprichwoerter', 'maerchen', 'ab18',
] as const;

/** Nur Vorschläge; die Kategorie bleibt Freitext (außer Pantomime). */
export const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  question: ['Geografie', 'Geschichte', 'Wissenschaft', 'Sport', 'Essen & Trinken', 'Musik', 'Filme', 'Natur', 'Technik', 'Allgemeinwissen'],
  taboo_card: ['Sport', 'Filme', 'Tiere', 'Essen', 'Technik', 'Musik', 'Natur', 'Geschichte', 'Alltag', 'Reisen'],
  headup_word: ['Prominente', 'Tiere', 'Berufe', 'Filme', 'Essen', 'Sport', 'Länder', 'Marken'],
  pantomime_word: [...PANTOMIME_CATEGORY_IDS],
  category: ['Tiere', 'Länder', 'Städte', 'Berufe', 'Sportarten', 'Filme', 'Serien', 'Marken', 'Farben'],
  bottle_card: ['Spaß', 'Party', 'JGA', 'Erwachsene', 'Eisbrecher'],
  truth: ['Harmlos', 'Lustig', 'Peinlich', 'Tabu'],
  dare: ['Harmlos', 'Lustig', 'Peinlich', 'Tabu'],
  pair: ['Essen', 'Reisen', 'Lifestyle', 'Unterhaltung', 'Sport'],
  character: ['Prominente', 'Disney', 'Superhelden', 'Historisch', 'Sportler', 'Musiker'],
  emoji_puzzle: ['Filme', 'Songs', 'Prominente', 'Disney', 'Serien', 'Spiele'],
  draw_word: ['Tiere', 'Objekte', 'Aktivitäten', 'Essen', 'Natur', 'Sport'],
  shared_question: ['Geografie', 'Geschichte', 'Wissenschaft', 'Unterhaltung', 'Sport'],
  fact: ['Natur', 'Wissenschaft', 'Geschichte', 'Popkultur', 'Geografie'],
  location: ['Städte', 'Natur', 'Sehenswürdigkeiten'],
};

/** Feste Kategorie-Kennungen (kein Freitext) — `null`, wenn die Kategorie frei ist. */
export function fixedCategoryIds(contentType: string): readonly string[] | null {
  return contentType === 'pantomime_word' ? PANTOMIME_CATEGORY_IDS : null;
}

/** Pantomime kennt keine Schwierigkeit — das Spiel wertet die Spalte nicht aus. */
export function usesDifficulty(contentType: string): boolean {
  return contentType !== 'pantomime_word';
}

export function categorySuggestions(contentType: string): string[] {
  return CATEGORY_SUGGESTIONS[contentType] ?? ['general'];
}

// ─── Inhalte lesen ───────────────────────────────────────────────

export type LangContent = Record<string, string>;
export type ContentMap = Record<string, LangContent>;

/** Werte können in alten Zeilen Zahlen/Booleans sein — alles als Text behandeln. */
export function asText(v: unknown): string {
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v : String(v);
}

/** Sprache gilt als gefüllt, wenn ein Nicht-Auswahlfeld Text hat (Auswahlfelder haben immer einen Vorgabewert). */
export function isLangFilled(contentType: string, data: Record<string, unknown> | undefined): boolean {
  if (!data) return false;
  return fieldsFor(contentType).some((f) => f.type !== 'select' && asText(data[f.key]).trim() !== '');
}

export function previewText(contentType: string, content: Record<string, unknown>, lang: string): string {
  const fields = fieldsFor(contentType);
  const order = [lang, BASE_LANG, 'en', ...LANG_CODES];
  for (const code of order) {
    const data = content?.[code] as Record<string, unknown> | undefined;
    if (!data || typeof data !== 'object') continue;
    const first = fields.find((f) => f.type !== 'select' && asText(data[f.key]).trim() !== '');
    if (first) return asText(data[first.key]);
  }
  return '';
}

export function langCoverage(contentType: string, content: Record<string, unknown>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const l of LANGS) out[l.code] = isLangFilled(contentType, content?.[l.code] as Record<string, unknown> | undefined);
  return out;
}

/** Felder, die eine Volltextsuche durchsucht (nur Text, keine Auswahl/Zahl). */
export function searchableFieldKeys(contentType: string): string[] {
  return fieldsFor(contentType)
    .filter((f) => f.type === 'text' || f.type === 'textarea')
    .map((f) => f.key);
}
