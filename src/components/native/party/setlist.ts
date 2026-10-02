/**
 * setlist.ts — reine Logik der geplanten Spielreihenfolge ("Set-Liste").
 *
 * Bewusst ohne React: Reihenfolge, Dauerschaetzung und vor allem die
 * PREMIUM-PRUEFUNG entscheiden, ob ein Abend um 23 Uhr an einer Bezahlschranke
 * stehen bleibt. Diese Fragen gehoeren in reine Funktionen, nicht in eine
 * Render-Funktion.
 *
 * Der Katalog kommt aus `@/lib/playable-games` — die Registry ist die einzige
 * Wahrheit ueber vorhandene Spiele. (Der Picker fuehrte bis hierher eine
 * eigene, bereits veraltete Kopie.)
 */
import { getFreePlaysLeft, isGamePremium } from "@/games/premium/gameConfig";
import { gameAvailability, playableGames, type GameAvailability, type PlayableGame } from "@/lib/playable-games";

// ── Dauerschaetzung ────────────────────────────────────────────────

/**
 * Erfahrungswerte je Spiel in Minuten, bei vier Mitspielern.
 *
 * Es geht um eine Groessenordnung fuer die Abendplanung ("passt das noch vor
 * Mitternacht?"), nicht um eine Stoppuhr. Unbekannte Kennungen bekommen den
 * Standardwert, damit ein neues Spiel die Schaetzung nie auf 0 zieht.
 */
const GAME_MINUTES: Record<string, number> = {
  bomb: 5,
  headup: 6,
  taboo: 8,
  category: 6,
  "this-or-that": 5,
  hochstapler: 10,
  "wahrheit-pflicht": 10,
  "wer-bin-ich": 8,
  flaschendrehen: 8,
  "emoji-raten": 6,
  "fake-or-fact": 6,
  schnellzeichner: 10,
  "split-quiz": 10,
  "geteilt-gequizzt": 10,
  "story-builder": 8,
  "wo-ist-was": 8,
  "drueck-das-wort": 6,
  ohrwurm: 10,
  pixeljagd: 7,
  closeenough: 7,
  pantomime: 8,
  brew: 10,
};

const DEFAULT_MINUTES = 8;

/** Ab dem fuenften Mitspieler dauert jede Runde spuerbar laenger. */
const BASE_PLAYERS = 4;
const MINUTES_PER_EXTRA_PLAYER = 0.5;

export function estimateGameMinutes(gameId: string, playerCount: number): number {
  const base = GAME_MINUTES[gameId] ?? DEFAULT_MINUTES;
  const extra = Math.max(0, playerCount - BASE_PLAYERS) * MINUTES_PER_EXTRA_PLAYER;
  return base + extra;
}

export function estimateSetlistMinutes(gameIds: string[], playerCount: number): number {
  const total = gameIds.reduce((sum, id) => sum + estimateGameMinutes(id, playerCount), 0);
  return Math.round(total);
}

/**
 * Beschriftung der Dauer.
 *
 * Zwei getrennte Schluessel statt i18next-Pluralen: Polnisch braucht vier
 * Formen, Arabisch sechs — fehlt eine davon, faellt die Anzeige stumm auf
 * Englisch zurueck. Die Zahl steht darum immer als eingesetzter Wert daneben.
 */
export function formatSetlistDuration(
  minutes: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (minutes < 60) return t("nativeExtra.partyNight.durationMin", { n: minutes });
  return t("nativeExtra.partyNight.durationHour", {
    h: Math.floor(minutes / 60),
    m: minutes % 60,
  });
}

// ── Reihenfolge ────────────────────────────────────────────────────

/** Ein Spiel steht hoechstens einmal in der Liste: Tippen legt an, erneutes Tippen entfernt. */
export function toggleSetlistEntry(gameIds: string[], gameId: string): string[] {
  return gameIds.includes(gameId)
    ? gameIds.filter((id) => id !== gameId)
    : [...gameIds, gameId];
}

/** Tauscht einen Eintrag mit seinem Nachbarn. Am Rand passiert nichts. */
export function moveSetlistEntry(gameIds: string[], index: number, delta: number): string[] {
  const target = index + delta;
  if (index < 0 || index >= gameIds.length) return gameIds;
  if (target < 0 || target >= gameIds.length) return gameIds;
  const next = [...gameIds];
  next[index] = gameIds[target];
  next[target] = gameIds[index];
  return next;
}

// ── Katalog inkl. Premium-Pruefung ─────────────────────────────────

export interface SetlistGame extends PlayableGame {
  /** Premium-Spiel laut `gameConfig` (nicht laut Registry-Feld `tier`). */
  isPremiumGame: boolean;
  /** Heute noch verfuegbare Gratis-Runden dieses Spiels. */
  freePlaysLeft: number;
  /** true = jetzt nicht waehlbar, weil die Gratis-Runden aufgebraucht sind. */
  locked: boolean;
  /** Geschaetzte Dauer bei der aktuellen Spielerzahl. */
  minutes: number;
  /**
   * Die EINE Party-Regel (`gameAvailability`) fuer diese Runde: `plannable`
   * = darf auf die Liste (fehlen nur Leute, bleibt es planbar), `startable`
   * = kann jetzt starten.
   */
  availability: GameAvailability;
}

/**
 * Lokale Party: alle zaehlen, niemand setzt aus. Premium regelt hier das
 * Gratis-Runden-Kontingent (`locked`), darum `hostPremium: true`.
 */
export function localGameAvailability(gameId: string, playerCount: number): GameAvailability {
  return gameAvailability(gameId, { mode: "local-party", phonePlayers: playerCount, guestPlayers: 0, hostPlays: false, hostPremium: true });
}

/**
 * Der naechste Eintrag ab `fromIndex`, der JETZT starten kann.
 * `-1` heisst: ab hier kann gerade nichts starten.
 *
 * WARUM ES DAS GIBT: Die Set-Liste wird am Anfang geplant, aber Leute gehen.
 * Die Lobby bot bis hierher den faelligen Eintrag ungeprueft an — bei zwei
 * verbliebenen Gaesten startete ihr grosser Knopf IMPOSTOR, das mit vier
 * Personen beginnt und deshalb gar nicht erst laeuft.
 */
export function nextFittingIndex(
  playlist: string[],
  fromIndex: number,
  playerCount: number,
): number {
  for (let i = Math.max(0, fromIndex); i < playlist.length; i++) {
    const game = playableGames.find((g) => g.id === playlist[i]);
    // Unbekannte Kennung nicht verschlucken — sonst verschwindet ein Eintrag
    // stillschweigend, statt dass jemand den Fehler bemerkt.
    if (!game || localGameAvailability(game.id, playerCount).startable) return i;
  }
  return -1;
}

/**
 * Eintraege, die in dieser Runde NIE laufen koennen (zu viele Leute,
 * unbekannt) — sie duerfen nicht auf die Liste. Fehlen nur Leute, bleibt ein
 * Spiel planbar; ob es starten kann, entscheidet `nextFittingIndex`.
 */
export function findUnfitSetlistEntries(gameIds: string[], playerCount: number): string[] {
  return gameIds.filter((id) => {
    const game = playableGames.find((g) => g.id === id);
    return !!game && !localGameAvailability(id, playerCount).plannable;
  });
}

export interface SetlistCatalogOptions {
  isPremium: boolean;
  /** Premium-Status noch nicht geladen — dann NIE sperren (kein Schloss-Flackern). */
  premiumUnknown: boolean;
  playerCount: number;
}

/**
 * Der vollstaendige Katalog mit vorab aufgeloester Sperre.
 *
 * Genau hier faellt die Entscheidung, die den Abend rettet: Ein Spiel, dessen
 * Gratis-Runden fuer heute verbraucht sind, ist schon bei der PLANUNG gesperrt
 * — nicht erst, wenn um 23 Uhr Spiel 5 an der Reihe waere. Die Regel ist
 * dieselbe wie in `GamesHub`, damit beide Oberflaechen nicht auseinanderlaufen.
 */
export function buildSetlistCatalog(options: SetlistCatalogOptions): SetlistGame[] {
  const { isPremium, premiumUnknown, playerCount } = options;

  return playableGames.map((game) => {
    const isPremiumGame = isGamePremium(game.id);
    const freePlaysLeft = isPremiumGame ? getFreePlaysLeft(game.id) : Infinity;
    return {
      ...game,
      isPremiumGame,
      freePlaysLeft,
      locked: isPremiumGame && !premiumUnknown && !isPremium && freePlaysLeft <= 0,
      minutes: estimateGameMinutes(game.id, playerCount),
      availability: localGameAvailability(game.id, playerCount),
    };
  });
}

/** Nachschlagetabelle Kennung → Katalogeintrag. */
export function setlistCatalogIndex(catalog: SetlistGame[]): Map<string, SetlistGame> {
  return new Map(catalog.map((game) => [game.id, game]));
}

export interface PremiumContext {
  isPremium: boolean;
  /** Premium-Status noch nicht geladen — im Zweifel nicht sperren. */
  premiumUnknown: boolean;
}

/**
 * Ist dieses Spiel JETZT gesperrt?
 *
 * Bewusst ohne Zwischenspeicher: `getFreePlaysUsed` haengt am Spiel UND am
 * Kalendertag. Zwischen dem Planen um 20 Uhr und Spiel 6 um kurz nach
 * Mitternacht kann sich beides geaendert haben — eine zweite Party auf
 * demselben Geraet, oder schlicht der Tageswechsel.
 */
export function isSetlistEntryLocked(gameId: string, ctx: PremiumContext): boolean {
  if (ctx.premiumUnknown || ctx.isPremium) return false;
  return isGamePremium(gameId) && getFreePlaysLeft(gameId) <= 0;
}

/**
 * Alle Eintraege der Liste, die JETZT gesperrt sind — ein Durchlauf.
 *
 * Reine localStorage-Lesevorgaenge, also billig genug, um sie beim Start der
 * Set-Liste UND vor jedem Weiterruecken zu wiederholen.
 */
export function findLockedSetlistEntries(gameIds: string[], ctx: PremiumContext): string[] {
  if (ctx.premiumUnknown || ctx.isPremium) return [];
  return gameIds.filter((id) => isSetlistEntryLocked(id, ctx));
}

// ── Laengen-Grenze der Set-Liste ────────────────────────────────────

/**
 * Ein Abend fasst gratis drei Spiele. Der Party-Modus selbst bleibt fuer
 * alle offen — er IST das Produkt, ihn zu sperren wuerde das Unterscheidungs-
 * merkmal genau vor Unentschlossenen verstecken. Premium hebt stattdessen
 * die Tiefe auf, nicht den Zugang.
 */
export const FREE_SETLIST_LIMIT = 3;

/**
 * Darf JETZT ein weiteres Spiel eingeplant werden?
 *
 * Symmetrisch zu `isSetlistEntryLocked`: `premiumUnknown` sperrt NIE, sonst
 * flackert die Grenze beim Start, waehrend der Premium-Status noch laedt.
 * Bewusst `>=` statt `>` — bei bereits drei geplanten Spielen waere das
 * vierte das erste, das ueber die Gratis-Grenze hinausgeht.
 */
export function isSetlistLengthLocked(gameIds: string[], ctx: PremiumContext): boolean {
  if (ctx.premiumUnknown || ctx.isPremium) return false;
  return gameIds.length >= FREE_SETLIST_LIMIT;
}

/**
 * Die Spiele einer BEREITS geplanten Liste, die ueber das Gratis-Limit
 * hinausgehen — leer, wenn die Liste passt oder Premium/unbekannter Status
 * ohnehin keine Grenze kennt.
 *
 * WARUM ES DAS GIBT: `isSetlistLengthLocked` verhindert nur das Hinzufuegen
 * eines WEITEREN Spiels. Eine schon bestehende laengere Liste — etwa aus
 * einer bereits laufenden Party oder weil sie waehrend `premiumUnknown`
 * zusammengestellt wurde — darf dadurch nicht rueckwirkend gekuerzt werden.
 * Diese Funktion liest nur; gekuerzt wird ausschliesslich durch eine
 * bewusste Nutzeraktion im Picker (siehe `handleStartWithLimit`).
 */
export function findExcessSetlistEntries(gameIds: string[], ctx: PremiumContext): string[] {
  if (ctx.premiumUnknown || ctx.isPremium) return [];
  if (gameIds.length <= FREE_SETLIST_LIMIT) return [];
  return gameIds.slice(FREE_SETLIST_LIMIT);
}
