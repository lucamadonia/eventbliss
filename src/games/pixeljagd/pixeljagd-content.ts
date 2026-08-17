/**
 * PIXELJAGD — Inhalte.
 *
 * Zweischichtig, wie bei OHRWURM (`ohrwurm-content.ts` + `ohrwurm-extra-songs.ts`):
 *  1. ein mitgelieferter Grundstock aus `public/images/pixeljagd/` (same-origin,
 *     damit der Canvas nicht taintet — siehe pixelate.ts),
 *  2. dazu die per Admin gepflegten Bilder aus der Tabelle `pixel_images`.
 *
 * Sprachen: Antworten und Aliase liegen pro Sprache im selben Datensatz statt in
 * zehn Einzeldateien. Ein Motiv ist sprachunabhängig — nur sein Name ändert
 * sich, und ein Löwe bleibt in allen zehn Sprachen dasselbe Bild. Zehn getrennte
 * Dateien würden hier nur denselben Bildpfad zehnmal wiederholen.
 *
 * CREDIT ist Pflicht. Es wird beim Auflösen sichtbar angezeigt (Handy und TV)
 * und steht in der Adminliste — das Impressum verspricht, Fremdinhalte zu
 * kennzeichnen, und bei „Stars"/„Marken" ist die Herkunft ohnehin die
 * entscheidende Information.
 */
import i18n from 'i18next';

export const PIXEL_CATEGORIES = [
  'tiere',
  'stars',
  'filme',
  'essen',
  'orte',
  'marken',
] as const;

export type PixelCategory = (typeof PIXEL_CATEGORIES)[number];

/** Sprachcode → Antwort. `de` ist Pflicht und dient als Fallback. */
export type LocalizedAnswer = { de: string } & Partial<Record<string, string>>;

export interface PixelPuzzleSource {
  id: string;
  /** same-origin Pfad oder Supabase-Public-URL. NIEMALS ein fremder Host. */
  image: string;
  answer: LocalizedAnswer;
  /** Zusätzlich akzeptierte Schreibweisen, sprachübergreifend. */
  aliases?: string[];
  category: PixelCategory;
  difficulty?: 1 | 2 | 3;
  /** Bildnachweis — wird im Spiel angezeigt. Pflicht. */
  credit: string;
  /** Optionaler Link zur Quelle. */
  sourceUrl?: string;
}

/** Was das Spiel tatsächlich benutzt — bereits auf die aktive Sprache aufgelöst. */
export interface PixelPuzzle {
  id: string;
  image: string;
  answer: string;
  aliases: string[];
  category: PixelCategory;
  difficulty: 1 | 2 | 3;
  credit: string;
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// Grundstock. Bewusst klein gehalten: der Schwerpunkt liegt auf den selbst
// gepflegten Bildern über /admin/pixel-images.
// ---------------------------------------------------------------------------
const BASE: PixelPuzzleSource[] = [];

// Von der Adminseite nachgeladene Bilder (siehe pixeljagd-extra.ts).
let _extra: PixelPuzzleSource[] = [];

export function setExtraPuzzles(list: PixelPuzzleSource[]): void {
  _extra = list;
}

function currentLang(): string {
  return i18n.language?.split('-')[0] || 'de';
}

/** Löst einen Datensatz auf die aktive Sprache auf. */
function resolve(src: PixelPuzzleSource, lang: string): PixelPuzzle {
  const answer = src.answer[lang] || src.answer.de;
  // Alle übrigen Sprachvarianten sind automatisch gültige Aliase — dadurch
  // zählt „Lion" auch dann, wenn die App gerade auf Deutsch steht.
  const fromOtherLangs = Object.values(src.answer).filter(
    (v): v is string => !!v && v !== answer,
  );
  return {
    id: src.id,
    image: src.image,
    answer,
    aliases: [...(src.aliases ?? []), ...fromOtherLangs],
    category: src.category,
    difficulty: src.difficulty ?? 2,
    credit: src.credit,
    sourceUrl: src.sourceUrl,
  };
}

/**
 * Alle spielbaren Motive der aktiven Sprache, optional auf Kategorien gefiltert.
 * Erst zur Deck-Bauzeit aufrufen, nie auf Modulebene — sonst greift ein
 * Sprachwechsel nicht (gleiche Falle wie bei EmojiGuess).
 */
export function getPixelPuzzles(categories?: PixelCategory[]): PixelPuzzle[] {
  const lang = currentLang();
  const all = [...BASE, ..._extra];
  const filtered = categories?.length
    ? all.filter((p) => categories.includes(p.category))
    : all;
  return filtered.map((p) => resolve(p, lang));
}

/** i18n-Schlüssel für einen Kategorienamen. */
export function categoryLabelKey(c: PixelCategory): string {
  return `games.pixeljagd.categories.${c}`;
}
