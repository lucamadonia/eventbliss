/**
 * game-registry — die EINE Zuordnung zwischen der App-Spieleliste
 * (`playable-games.ts`) und der Tabelle `game_content`.
 *
 * Hintergrund: Der Admin benutzte früher eigene Spiel-Kennungen
 * (`thisorthat`, `truthdare` ...), die App nennt dieselben Spiele
 * `this-or-that`, `wahrheit-pflicht` ... Die DB-Werte werden bewusst NICHT
 * umgeschrieben; diese Datei übersetzt nur.
 *
 * Was die App wirklich aus `game_content` liest — geprüft an allen Lesern von
 * `loadFromDB` / `loadFromCacheSync` (src/games/content/*) UND an deren
 * Aufrufern:
 *   - pantomime/pantomime_word: `preloadPantomimeWords()` wird in
 *     PantomimeGame.tsx aufgerufen → LIVE.
 *   - bomb/question, taboo/taboo_card, headup/headup_word: der Lade-Code
 *     existiert (`preloadQuestions` usw.), wird aber von KEINEM Spiel
 *     aufgerufen → die App liest diese Zeilen derzeit nicht ("vorbereitet").
 * Alles andere liegt fest im Code der App.
 */
import { playableGames, type PlayableGame } from '@/lib/playable-games';

export type GameStatus = 'live' | 'editor' | 'static';

/** Alte Admin-Kennung → Kennung in der App. Nur Abweichungen. */
export const LEGACY_ID_MAP: Readonly<Record<string, string>> = {
  thisorthat: 'this-or-that',
  truthdare: 'wahrheit-pflicht',
  emojiguess: 'emoji-raten',
  fakeorfact: 'fake-or-fact',
  whoami: 'wer-bin-ich',
  storybuilder: 'story-builder',
  sharedquiz: 'geteilt-gequizzt',
  quickdraw: 'schnellzeichner',
  splitquiz: 'split-quiz',
  bottlespin: 'flaschendrehen',
};

/** App-Spiel → Inhaltstypen, die die App aus der Datenbank liest. */
export const LIVE_PAIRS: Readonly<Record<string, readonly string[]>> = {
  pantomime: ['pantomime_word'],
};

/**
 * Lade-Code vorhanden, aber nicht angeschlossen. Sobald ein Spiel sein
 * `preload…()` aufruft, wandert das Paar nach `LIVE_PAIRS`. Bis dahin darf man
 * hier pflegen und Standardinhalte ergänzen — mit dem Hinweis, dass die App es
 * noch nicht lädt.
 */
export const PREPARED_PAIRS: Readonly<Record<string, readonly string[]>> = {
  bomb: ['question'],
  taboo: ['taboo_card'],
  headup: ['headup_word'],
};

/** Spiele mit eigenem Editor (eigene Tabelle, eigene Route). */
export const EDITOR_ROUTES: Readonly<Record<string, { path: string; labelKey: string; label: string }>> = {
  ohrwurm: { path: '/admin/ohrwurm-songs', labelKey: 'admin.games.editor.songs', label: 'Songs verwalten' },
  hitbuzzer: { path: '/admin/ohrwurm-songs', labelKey: 'admin.games.editor.songsShared', label: 'Songs verwalten (gemeinsam mit Ohrwurm)' },
  pixeljagd: { path: '/admin/pixel-images', labelKey: 'admin.games.editor.images', label: 'Bilder verwalten' },
  closeenough: { path: '/admin/closeenough-questions', labelKey: 'admin.games.editor.questions', label: 'Fragen verwalten' },
};

/** Inhaltstypen je Kennung in `game_content` (so wie der Admin sie bisher kannte). */
export const CONTENT_TYPES_BY_DB_ID: Readonly<Record<string, readonly string[]>> = {
  bomb: ['question', 'category'],
  taboo: ['taboo_card'],
  headup: ['headup_word'],
  pantomime: ['pantomime_word'],
  category: ['category'],
  emojiguess: ['emoji_puzzle'],
  fakeorfact: ['fact'],
  truthdare: ['truth', 'dare'],
  thisorthat: ['pair'],
  whoami: ['character'],
  bottlespin: ['bottle_card'],
  storybuilder: ['prompt', 'starter'],
  sharedquiz: ['shared_question'],
  quickdraw: ['draw_word'],
  splitquiz: ['question'],
  hochstapler: ['word_set'],
  'wo-ist-was': ['location'],
};

const REVERSE_LEGACY: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(LEGACY_ID_MAP).map(([legacy, app]) => [app, legacy]),
);

/** App-Kennung zu einer Kennung aus der Datenbank (alt oder gleich). */
export function appIdForDbId(dbId: string): string {
  return LEGACY_ID_MAP[dbId] ?? dbId;
}

/** Kennung, unter der die Zeilen dieses App-Spiels in `game_content` stehen. */
export function dbIdForAppId(appId: string): string {
  return REVERSE_LEGACY[appId] ?? appId;
}

export function resolveGameStatus(appId: string): GameStatus {
  if (EDITOR_ROUTES[appId]) return 'editor';
  if (LIVE_PAIRS[appId]) return 'live';
  return 'static';
}

/** Inhaltstypen, die für dieses App-Spiel in der Datenbank vorkommen können. */
export function contentTypesForApp(appId: string): readonly string[] {
  return CONTENT_TYPES_BY_DB_ID[dbIdForAppId(appId)] ?? [];
}

/** Liest die App genau dieses Paar aus der Datenbank? */
export function isLivePair(appId: string, contentType: string): boolean {
  return LIVE_PAIRS[appId]?.includes(contentType) ?? false;
}

export function isPreparedPair(appId: string, contentType: string): boolean {
  return PREPARED_PAIRS[appId]?.includes(contentType) ?? false;
}

/** Neue Einträge anlegen/importieren ist nur sinnvoll, wo die App liest oder lesen kann. */
export function canCreateContent(appId: string, contentType: string): boolean {
  return isLivePair(appId, contentType) || isPreparedPair(appId, contentType);
}

export interface ContentPair { appId: string; dbId: string; contentType: string }

/** Alle (Spiel, Inhaltstyp)-Paare, die in `game_content` vorkommen können. */
export function allContentPairs(games: readonly PlayableGame[] = playableGames): ContentPair[] {
  const out: ContentPair[] = [];
  for (const g of games) {
    if (resolveGameStatus(g.id) === 'editor') continue;
    const dbId = dbIdForAppId(g.id);
    for (const contentType of contentTypesForApp(g.id)) out.push({ appId: g.id, dbId, contentType });
  }
  return out;
}

export function pairKey(dbId: string, contentType: string): string {
  return `${dbId}/${contentType}`;
}

/** Spielreihenfolge & Anzeige-Zeile für den Hub. */
export interface HubGame {
  game: PlayableGame;
  status: GameStatus;
  dbId: string;
}

export function buildHubGames(games: readonly PlayableGame[] = playableGames): HubGame[] {
  return games.map((game) => ({ game, status: resolveGameStatus(game.id), dbId: dbIdForAppId(game.id) }));
}

export interface HubFilter {
  query: string;
  status: GameStatus | 'all';
  tier: 'free' | 'premium' | 'all';
}

/** Filter des Hubs: Name wird vom Aufrufer übersetzt und mitgegeben. */
export function filterHubGames(
  items: readonly HubGame[],
  f: HubFilter,
  nameOf: (g: PlayableGame) => string,
): HubGame[] {
  const q = f.query.trim().toLowerCase();
  return items.filter((h) => {
    if (f.status !== 'all' && h.status !== f.status) return false;
    if (f.tier !== 'all' && h.game.tier !== f.tier) return false;
    if (!q) return true;
    return nameOf(h.game).toLowerCase().includes(q) || h.game.id.includes(q);
  });
}
