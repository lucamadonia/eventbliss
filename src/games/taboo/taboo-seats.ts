/**
 * WORTVERBOT (taboo) mit 🔁-Gaesten am Host-Handy — sharedDevice 'turns'.
 *
 * Pro Zug ist genau EIN Platz dran (der Erklaerer); die Karte (Begriff +
 * verbotene Woerter) ist geheim. Sie sehen duerfen nur:
 *   - der Erklaerer (aktives Team),
 *   - der Schiedsrichter aus dem anderen Team (drueckt „Tabu!“).
 * Die Mitraten des Erklaerer-Teams sehen sie nie — auch nicht auf dem
 * Host-Handy, wenn dort gerade ein Ratender sitzt.
 *
 * Grundregel fuer das geteilte Handy: Die Karte haengt nicht an „wem gehoert
 * das Handy“, sondern an „wer HAELT es gerade“ (`phoneHolder`). Waehrend es
 * unterwegs ist, haelt es niemand → nie Karte. Ein Gast haelt es erst nach
 * „Ich bin …“ (Halten). Alles hier ist rein, damit Host-Ablauf, Handys und
 * Tests dieselbe Regel teilen.
 */
import type { TabooCard } from '../content/taboo-words';
import type { TeamRoster } from './removal';

export type TabooPhase = 'setup' | 'turnStart' | 'playing' | 'turnSummary' | 'gameOver';

export interface TabooRoles {
  /** Platz, der erklaert (aktives Team). */
  explainerId: string | null;
  /** Platz aus dem anderen Team, der die Karte mitliest und „Tabu!“ drueckt. */
  refereeId: string | null;
}

export interface SeatDevice { id: string; controlledBy?: string }

/** Geraet eines Platzes: 🔁-Gaeste spielen am Geraet, das sie steuert. */
export const deviceOf = (players: readonly SeatDevice[], id: string): string =>
  players.find(p => p.id === id)?.controlledBy ?? id;

/** Raumhaelfte als Rueckfall, solange Teams (alte Stande) noch keine `ids` tragen. */
function legacyHalf(roomIds: readonly string[], teamIdx: number): string[] {
  const mid = Math.ceil(roomIds.length / 2);
  return teamIdx === 0 ? roomIds.slice(0, mid) : roomIds.slice(mid);
}

/**
 * Schiedsrichter: reihum im anderen Team (ab dessen naechstem Erklaerer), aber
 * bevorzugt jemand an einem ANDEREN Geraet als der Erklaerer — sonst laege die
 * Tabu-Taste auf demselben Handy, das gerade der Erklaerer haelt.
 */
export function pickReferee(candidates: readonly string[], start: number, explainerDevice: string | null, device: (id: string) => string): string | null {
  if (!candidates.length) return null;
  const from = ((start % candidates.length) + candidates.length) % candidates.length;
  for (let step = 0; step < candidates.length; step++) {
    const id = candidates[(from + step) % candidates.length];
    if (!explainerDevice || device(id) !== explainerDevice) return id;
  }
  return candidates[from];
}

/** Erklaerer und Schiedsrichter des laufenden Zugs (online; lokal unbenutzt). */
export function tabooRoles(
  teams: readonly [TeamRoster, TeamRoster],
  activeTeamIdx: number,
  explainerIdx: readonly [number, number],
  players: readonly SeatDevice[] = [],
): TabooRoles {
  const roomIds = players.map(p => p.id);
  const active = activeTeamIdx === 1 ? 1 : 0, other = 1 - active;
  const activeIds = teams[active].ids ?? legacyHalf(roomIds, active);
  const otherIds = teams[other].ids ?? legacyHalf(roomIds, other);
  const explainerId = activeIds[explainerIdx[active]] ?? null;
  const device = (id: string) => deviceOf(players, id);
  const refereeId = pickReferee(otherIds, explainerIdx[other], explainerId ? device(explainerId) : null, device);
  return { explainerId, refereeId };
}

/**
 * Wer das Host-Handy JETZT haben muss (`null` = der Host selbst):
 *  - Gast-Erklaerer: ab der Zugansage bis Zugende (verdeckt, Halten).
 *  - Gast-Schiedsrichter: nur im laufenden Zug, und nur wenn der Erklaerer
 *    nicht selbst an diesem Handy sitzt (das Handy kann nur einer halten).
 * Haelt der Host selbst eine Rolle, bleibt das Handy bei ihm.
 */
export function tabooHandoverSeat(
  phase: string,
  roles: TabooRoles,
  isGuest: (id: string) => boolean,
  isLocal: (id: string) => boolean,
): string | null {
  const { explainerId: e, refereeId: r } = roles;
  if ((phase === 'turnStart' || phase === 'playing') && e && isGuest(e)) return e;
  if (phase === 'playing' && r && isGuest(r) && !(e && isLocal(e))) return r;
  return null;
}

/**
 * Wer haelt dieses Handy gerade? Lokal niemand Bestimmtes (`null`, das Handy
 * wandert frei); online der bestaetigte Gast, sonst der Besitzer — und
 * niemand, solange es unterwegs ist.
 */
export function phoneHolder(args: { isOnline: boolean; myId: string | null; activeGuest: string | null; handoverPaused: boolean }): string | null {
  if (!args.isOnline || args.handoverPaused) return null;
  return args.activeGuest ?? args.myId;
}

/**
 * DIE Geheimnis-Regel: Darf dieses Handy die Karte jetzt zeigen?
 * Nur im laufenden Zug. Lokal (ein Handy, Weitergeben wie bisher) ja; online
 * nur, wenn der aktuelle Halter Erklaerer oder Schiedsrichter ist.
 */
export function mayHolderSeeCard(args: { isOnline: boolean; phase: string; holder: string | null; roles: TabooRoles }): boolean {
  if (args.phase !== 'playing') return false;
  if (!args.isOnline) return true;
  const { holder, roles } = args;
  return !!holder && (holder === roles.explainerId || holder === roles.refereeId);
}

export type TabooSeatRole = 'explainer' | 'referee' | 'guesser' | 'watcher';

/** Rolle des Halters im laufenden Zug — bestimmt den Bildschirm. */
export function tabooSeatRole(args: { isOnline: boolean; holder: string | null; roles: TabooRoles; activeTeamIds: readonly string[] }): TabooSeatRole {
  if (!args.isOnline) return 'explainer';
  const { holder, roles } = args;
  if (!holder) return 'watcher';
  if (holder === roles.explainerId) return 'explainer';
  if (holder === roles.refereeId) return 'referee';
  return args.activeTeamIds.includes(holder) ? 'guesser' : 'watcher';
}

/** Geraete, die einen eigenen Zustand bekommen: nie der Host selbst, nie 🔁-Gaeste (kein Geraet). */
export function tabooRecipients(players: readonly SeatDevice[], myId: string, localIds: readonly string[]): string[] {
  return players.filter(p => p.id !== myId && !p.controlledBy && !localIds.includes(p.id)).map(p => p.id);
}

const HIDDEN_CARD: TabooCard = { term: '', forbidden: [], category: '', difficulty: 'easy' };

interface CardState { phase: string; currentCard: TabooCard | null; turnResults: { card: TabooCard; result: string }[] }

/**
 * Zustand fuer EIN Geraet: Karte nur fuer Erklaerer/Schiedsrichter und nur im
 * laufenden Zug. Waehrend des Zugs sehen alle anderen auch die schon
 * gespielten Karten nicht (uebersprungene Begriffe waeren sonst ein Tipp);
 * die Zusammenfassung danach ist oeffentlich.
 */
export function tabooSnapshotFor<S extends CardState>(state: S, recipient: string, roles: TabooRoles): S {
  const sees = state.phase === 'playing' && (recipient === roles.explainerId || recipient === roles.refereeId);
  return {
    ...state,
    currentCard: sees ? state.currentCard : null,
    turnResults: state.phase === 'playing' && !sees ? state.turnResults.map(r => ({ ...r, card: HIDDEN_CARD })) : state.turnResults,
  };
}

export interface TabooSeat { id: string; name: string; avatar: string; color: string }
export interface TabooTvPlayer extends TabooSeat { team: 0 | 1 }

const TEAM_HEX = ['#ff8572', '#e6ce81'] as const;

/** Sitz-Identitaet (Name, Symbol, Farbe) — Rueckfall Initiale + Teamfarbe. */
export function tabooSeat(id: string, name: string, team: 0 | 1, seats: readonly Partial<TabooSeat>[] = []): TabooSeat {
  const seat = seats.find(s => s.id === id);
  return { id, name: seat?.name || name, avatar: seat?.avatar || (name || '?').slice(0, 1).toUpperCase(), color: seat?.color || TEAM_HEX[team] };
}

/** Volle Spieler-Identitaet fuer den Fernseher — nie die Karte. */
export function tabooTvPlayers(teams: readonly [TeamRoster, TeamRoster], seats: readonly Partial<TabooSeat>[] = []): TabooTvPlayer[] {
  return teams.flatMap((team, t) => (team.ids ?? []).map((id, i) => ({ ...tabooSeat(id, team.players[i] ?? '', t as 0 | 1, seats), team: t as 0 | 1 })));
}

/**
 * Oeffentliches TV-Bild (geht auch ueber den Raumkanal an alle Handys):
 * ausdruecklich aufgezaehlte Felder, damit nie eine Karte mitreist.
 */
export function tabooTvState(input: {
  phase: string; phaseStartsAt: number; currentRound: number; totalRounds: number;
  teams: readonly [TeamRoster & { name: string; color: string; score: number }, TeamRoster & { name: string; color: string; score: number }];
  activeTeamIdx: number; explainer: TabooSeat | string; timeLeft: number;
  turnResults: readonly { result: string }[]; players: TabooTvPlayer[]; handover: unknown;
}) {
  const count = (kind: string) => input.turnResults.filter(r => r.result === kind).length;
  return {
    phase: input.phase, phaseStartsAt: input.phaseStartsAt, currentRound: input.currentRound, totalRounds: input.totalRounds,
    teams: input.teams.map(t => ({ name: t.name, color: t.color, score: t.score, players: [...t.players], ...(t.ids ? { ids: [...t.ids] } : {}) })),
    activeTeamIdx: input.activeTeamIdx, explainer: input.explainer, timeLeft: input.timeLeft,
    turnCorrect: count('correct'), turnTaboo: count('taboo'), turnSkipped: count('skipped'),
    // Eigener Schluessel (nicht `players`): die Party-Wertung liest Teams, keine Einzelspieler.
    roster: input.players, handover: input.handover ?? null,
  };
}
