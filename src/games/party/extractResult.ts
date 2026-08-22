/**
 * extractResult.ts — übersetzt den Zustand, den ein Spiel an
 * `useTVGameBridge` übergibt, in ein einheitliches Party-Ergebnis.
 *
 * Die 21 Spiele reichen ihren Zustand in mindestens fünf verschiedenen Formen
 * durch dieselbe Bruecke. Diese Datei ist die einzige Stelle, die diese
 * Unterschiede kennt — verifiziert am jeweiligen Spielcode:
 *
 *   `{name, score}[]`  Mehrheit (bottlespin, category, closeenough, emojiguess,
 *                      fakeorfact, findit, impostor, ohrwurm, pixeljagd,
 *                      quickdraw, sharedquiz, thisorthat, truthdare, whoami,
 *                      wordpress) → direkt uebernommen.
 *   `{name, penalties}[]`  bomb (`PlayerState` hat KEIN score, nur Strafen)
 *                      → invertiert: wenigste Strafen gewinnt.
 *   `teams[]`          taboo, pantomime → jedes Teammitglied bekommt die
 *                      Teampunktzahl und damit die Teamplatzierung.
 *   `teamA` / `teamB`  splitquiz reicht die beiden Teams EINZELN durch, nicht
 *                      als Array — und `players` ist dort nur `string[]`.
 *   `string[]`         headup → keine Punkte pro Spieler.
 *   Spieler ohne Punktfeld  story-builder → keine Punkte pro Spieler.
 *
 * `scored: false` heisst "Pausenspiel": Es kommt in die Historie und zaehlt als
 * gespielte Runde, veraendert aber die Gesamttabelle nicht. Die Namen stehen
 * trotzdem in `scores` (mit 0), damit `gamesPlayed` die richtigen Leute trifft.
 */
import { playableGameIds } from "@/lib/playable-games";

/** Vereinheitlichtes Ergebnis eines Spieldurchlaufs, geschluesselt nach Namen. */
export interface ExtractedResult {
  /** false = Pausenspiel: keine Punkte, kein Sieger, nur Historie. */
  scored: boolean;
  /** Spielername → Rohpunktzahl, hoeher ist immer besser. */
  scores: Record<string, number>;
}

/** Spiele, deren Zahlenfeld ein Malus ist (wenigste gewinnt). */
const INVERSE_GAMES = new Set(["bomb"]);

/**
 * Die Kennung, die ein Spiel an die Bruecke gibt, weicht bei 13 Spielen von der
 * Kennung in `playable-games.ts` ab. Fuer die Party zaehlt die Registry-Kennung,
 * sonst taucht dasselbe Spiel unter zwei Namen in der Historie auf.
 */
const BRIDGE_TO_REGISTRY: Record<string, string> = {
  impostor: "hochstapler",
  bottlespin: "flaschendrehen",
  findit: "wo-ist-was",
  quickdraw: "schnellzeichner",
  emojiguess: "emoji-raten",
  fakeorfact: "fake-or-fact",
  sharedquiz: "geteilt-gequizzt",
  splitquiz: "split-quiz",
  storybuilder: "story-builder",
  wordpress: "drueck-das-wort",
  thisorthat: "this-or-that",
  truthdare: "wahrheit-pflicht",
  whoami: "wer-bin-ich",
};

/**
 * Registry-Kennung eines laufenden Spiels.
 * Der Routen-Parameter `/games/:gameId` IST die Registry-Kennung und gewinnt,
 * solange er in der Registry steht; die Bruecken-Kennung ist nur der Rueckfall
 * (z. B. wenn ein Spiel ausserhalb der Route eingebettet laeuft).
 */
export function resolvePartyGameId(
  routeGameId: string | undefined,
  bridgeGameId: string
): string {
  if (routeGameId && playableGameIds.has(routeGameId)) return routeGameId;
  return BRIDGE_TO_REGISTRY[bridgeGameId] ?? bridgeGameId;
}

/**
 * Vergleichsform eines Spielernamens: ohne Rand-Leerzeichen, ohne doppelte
 * Leerzeichen, ohne Akzente, klein. Spiele kennen nur Namen — nur so findet
 * "José " wieder den Party-Spieler "jose".
 */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// ── Kleine Leser ───────────────────────────────────────────────────

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toScores(pairs: [string, number][]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [name, value] of pairs) scores[name] = value;
  return scores;
}

interface TeamLike {
  score: number;
  members: string[];
}

/**
 * Liest Teams — als Array (`teams`) oder als zwei Einzelfelder
 * (`teamA` / `teamB`, so macht es splitquiz).
 */
function readTeams(state: Record<string, unknown>): TeamLike[] | null {
  const candidates: unknown[] = [];
  if (Array.isArray(state.teams)) candidates.push(...state.teams);
  else {
    if (state.teamA) candidates.push(state.teamA);
    if (state.teamB) candidates.push(state.teamB);
  }

  const teams: TeamLike[] = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const team = candidate as Record<string, unknown>;
    const score = readNumber(team.score);
    const members = Array.isArray(team.players)
      ? (team.players.map(readName).filter(Boolean) as string[])
      : [];
    if (score === null || members.length === 0) continue;
    teams.push({ score, members });
  }
  return teams.length > 0 ? teams : null;
}

interface PlayerLike {
  name: string;
  score: number | null;
  penalties: number | null;
}

function readObjectPlayers(state: Record<string, unknown>): PlayerLike[] {
  if (!Array.isArray(state.players)) return [];
  const players: PlayerLike[] = [];
  for (const entry of state.players) {
    if (!entry || typeof entry !== "object") continue;
    const player = entry as Record<string, unknown>;
    const name = readName(player.name);
    if (!name) continue;
    players.push({
      name,
      score: readNumber(player.score),
      penalties: readNumber(player.penalties),
    });
  }
  return players;
}

function readNameList(state: Record<string, unknown>): string[] {
  if (!Array.isArray(state.players)) return [];
  return state.players.map(readName).filter(Boolean) as string[];
}

function unscored(names: string[]): ExtractedResult {
  return { scored: false, scores: toScores(names.map((n) => [n, 0])) };
}

// ── Hauptfunktion ──────────────────────────────────────────────────

/**
 * Normalisiert den Bruecken-Zustand eines Spiels zu `{ scored, scores }`.
 *
 * @param gameId Registry-Kennung (siehe {@link resolvePartyGameId}) — steuert
 *               nur die bekannten Sonderfaelle wie die Strafpunkt-Umkehr.
 * @param state  Der Zustand, den das Spiel an `useTVGameBridge` gibt.
 */
export function extractGameResult(
  gameId: string,
  state: Record<string, unknown> | null | undefined
): ExtractedResult {
  if (!state || typeof state !== "object") return { scored: false, scores: {} };

  const teams = readTeams(state);
  const objectPlayers = readObjectPlayers(state);

  if (objectPlayers.length > 0) {
    const hasScore = objectPlayers.some((p) => p.score !== null);
    const hasPenalties = objectPlayers.some((p) => p.penalties !== null);

    // Strafpunkte: wenigste gewinnt. Die Umkehr am Maximum haelt alle Werte
    // bei 0 oder darueber und laesst die Abstaende unveraendert.
    if (INVERSE_GAMES.has(gameId) || (!hasScore && hasPenalties)) {
      if (hasPenalties) {
        const worst = Math.max(...objectPlayers.map((p) => p.penalties ?? 0));
        return {
          scored: true,
          scores: toScores(objectPlayers.map((p) => [p.name, worst - (p.penalties ?? 0)])),
        };
      }
    }

    if (hasScore) {
      return {
        scored: true,
        scores: toScores(objectPlayers.map((p) => [p.name, p.score ?? 0])),
      };
    }

    // Spieler ohne jede Zahl (story-builder) — sofern nicht doch Teams zaehlen.
    if (!teams) return unscored(objectPlayers.map((p) => p.name));
  }

  if (teams) {
    const pairs: [string, number][] = [];
    for (const team of teams) {
      for (const member of team.members) pairs.push([member, team.score]);
    }
    return { scored: true, scores: toScores(pairs) };
  }

  // Reine Namensliste (headup) — mitgespielt, aber ohne eigene Wertung.
  const names = readNameList(state);
  if (names.length > 0) return unscored(names);

  return { scored: false, scores: {} };
}
