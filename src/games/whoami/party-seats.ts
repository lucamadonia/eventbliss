/**
 * WER BIN ICH? mit 🔁-Gaesten am Host-Handy (Masterplan 3.5 / 7, sharedDevice
 * 'secret'). Jede Person sieht jede Figur ausser der eigenen — auch auf einem
 * geteilten Handy. Rein, damit Host-Ablauf, Anzeige und Tests EINE Regel teilen.
 */
import { identityMayBeRevealed } from './question-rules';

export type WhoAmIPhase = 'setup' | 'assign' | 'asking' | 'answerVote' | 'guessing' | 'guessResult' | 'gameOver';

export interface SeatPlayer {
  id: string;
  character: string;
  questionsAsked: number;
  guessedCorrectly: boolean;
  eliminated: boolean;
}

/** Wer gerade eine Ja/Nein-Antwort gibt: alle ausser dem Fragenden, in Sitzreihenfolge. */
export function answerVoter<P extends { id: string }>(players: readonly P[], activeIdx: number, voterIdx: number): P | undefined {
  return players.filter((_, i) => i !== activeIdx)[voterIdx];
}

/**
 * Platz, der das (geteilte) Handy jetzt braucht. Ist es ein 🔁-Gast, wird das
 * Handy verdeckt an ihn weitergegeben (useSeatHandover).
 * - assign: der naechste lokale Platz, der die Karten der anderen noch nicht gesehen hat
 * - asking / guessing / guessResult: der Fragende (er sieht auch sein Ergebnis)
 * - answerVote: wer gerade antwortet
 */
export function whoamiActiveSeat(
  phase: string,
  players: readonly { id: string }[],
  activeIdx: number,
  voterIdx: number,
  assignViewer: string | null,
): string | null {
  switch (phase) {
    case 'assign': return assignViewer;
    case 'asking':
    case 'guessing':
    case 'guessResult': return players[activeIdx]?.id ?? null;
    case 'answerVote': return answerVoter(players, activeIdx, voterIdx)?.id ?? null;
    default: return null;
  }
}

/** Lokale Plaetze (Host zuerst), die die Karten der anderen noch ansehen muessen. */
export function pendingAssignViewers(localSeats: readonly string[], players: readonly { id: string }[], seen: readonly string[]): string[] {
  return localSeats.filter(id => players.some(p => p.id === id) && !seen.includes(id));
}

/** Names of seats at this phone that have not seen the cards yet: Start stays locked until it is empty. */
export function notSeenNames(pending: readonly string[], players: readonly { id: string; name: string }[]): string[] {
  return pending.flatMap(id => players.find(p => p.id === id)?.name ?? []);
}

/** Wer haelt das Handy: ein bestaetigter Gast, sonst der eigene Platz. */
export function holderSeat(myPlayerId: string, activeGuest: string | null | undefined): string {
  return activeGuest || myPlayerId;
}

/**
 * Figuren, die auf diesem Handy nur mit Halte-Geste erscheinen: Sitzen mehrere
 * Personen an einem Handy, gehoert eine gezeigte Figur womoeglich jemandem,
 * der gerade danebensteht. Ohne Gaeste: keine.
 */
export function guardedSeats(localSeats: readonly string[], guests: readonly string[]): string[] {
  return guests.length ? [...localSeats] : [];
}

export type CharacterView =
  | { kind: 'hidden' }
  | { kind: 'open'; text: string }
  | { kind: 'guarded'; text: string };

export interface CharacterViewContext {
  phase: string;
  /** Wer das Handy haelt. `null` = lokales Reihum-Spiel (eigener Ablauf, alles offen). */
  holderId: string | null;
  /** Der Fragende — nur seine Figur kann im Ergebnis aufgedeckt werden. */
  activeId?: string;
  maxQ?: number;
  guarded?: readonly string[];
}

/** Ist die Figur fuer alle aufgedeckt (Endstand, oder Ergebnis des Fragenden)? */
export function characterRevealed(player: SeatPlayer, ctx: Pick<CharacterViewContext, 'phase' | 'activeId' | 'maxQ'>): boolean {
  return ctx.phase === 'gameOver' || (player.id === ctx.activeId && identityMayBeRevealed(ctx.phase, player, ctx.maxQ));
}

/**
 * DIE Geheimnisregel: Darf der aktuelle Halter diese Figur sehen?
 * - aufgedeckt (Endstand / geloest / aufgegeben) → offen
 * - die eigene Figur des Halters → verdeckt
 * - Figur eines anderen Platzes an diesem Handy → nur mit Halte-Geste
 * - sonst offen
 */
export function characterView(player: SeatPlayer, ctx: CharacterViewContext): CharacterView {
  if (!player.character) return { kind: 'hidden' };
  if (characterRevealed(player, ctx)) return { kind: 'open', text: player.character };
  if (ctx.holderId === null) return { kind: 'open', text: player.character };
  if (player.id === ctx.holderId) return { kind: 'hidden' };
  if (ctx.guarded?.includes(player.id)) return { kind: 'guarded', text: player.character };
  return { kind: 'open', text: player.character };
}

/** Alle Figuren, die der Halter ansehen darf (Verteil-Ansicht) — nie seine eigene. */
export function visibleCharacters<P extends SeatPlayer>(players: readonly P[], ctx: CharacterViewContext): { player: P; view: Exclude<CharacterView, { kind: 'hidden' }> }[] {
  const out: { player: P; view: Exclude<CharacterView, { kind: 'hidden' }> }[] = [];
  for (const player of players) {
    if (ctx.holderId !== null && player.id === ctx.holderId) continue;
    const view = characterView(player, ctx);
    if (view.kind !== 'hidden') out.push({ player, view });
  }
  return out;
}

/**
 * Empfaenger des privaten Zustands: nur Plaetze mit eigenem Handy. Host und
 * 🔁-Gaeste haben kein eigenes Geraet — an sie geht nie etwas.
 */
export function snapshotRecipients(players: readonly { id: string }[], myPlayerId: string, localSeats: readonly string[]): string[] {
  return players.map(p => p.id).filter(id => id !== myPlayerId && !localSeats.includes(id));
}

/** Oeffentliche TV-Spieler: volle Identitaet, Figur erst im Endstand. */
export function whoamiTVPlayers<P extends SeatPlayer & { name: string; avatar: string; color: string; score: number }>(phase: string, players: readonly P[]) {
  return players.map(p => ({
    id: p.id, name: p.name, avatar: p.avatar, color: p.color, score: p.score,
    questionsAsked: p.questionsAsked, guessedCorrectly: p.guessedCorrectly, eliminated: p.eliminated,
    character: phase === 'gameOver' ? p.character : '',
  }));
}

/** Punkte fuer eine richtige Loesung nach `questionsAsked` Fragen. */
export function solveBonus(questionsAsked: number, maxQ: number): number {
  return Math.min(10, Math.max(1, maxQ - (questionsAsked + 1) + 1));
}
