// OHRWURM — Mitspielende verlassen die laufende Partie (Kick/Leave, Host-seitig).
// Rein, ohne React: der Host wendet das Ergebnis auf seinen State an und
// broadcastet wie gewohnt.

import { hasWon, type Participant, type Phase } from './ohrwurm-engine';

export interface RemovalState {
  participants: readonly Participant[];
  turn: number;
  phase: Phase;
  counteringId: string | null;
  winTarget: number;
}

/**
 * - `keep`: nur Roster/Zug-Index angepasst, Runde läuft weiter.
 * - `restartTurn`: aktive Person (DJ/Ratende) ist weg → nächste verbliebene
 *   Person beginnt eine frische Runde; `returnSong` = gezogene Karte zurück auf den Stapel.
 * - `reopenCounter`: konternde Person ist weg → Konter-Fenster wieder offen.
 * - `resolveNoCounter`: niemand kann mehr kontern → Runde ohne Konter auflösen.
 * - `gameOver`: die verbliebene Person mit erreichtem Ziel gewinnt.
 */
export type RemovalOutcome =
  | { kind: 'keep' }
  | { kind: 'restartTurn'; returnSong: boolean }
  | { kind: 'reopenCounter' }
  | { kind: 'resolveNoCounter' }
  | { kind: 'gameOver'; winnerId: string };

export type RemovalResult = { participants: Participant[]; turn: number } & RemovalOutcome;

const IN_ROUND: readonly Phase[] = ['draw', 'place', 'counter', 'counterPlace', 'reveal'];

/** Returns null when none of the ids is part of the match. */
export function dropOhrwurmPlayers(state: RemovalState, removedIds: readonly string[]): RemovalResult | null {
  const { participants, turn, phase, counteringId, winTarget } = state;
  const removed = new Set(removedIds);
  if (!participants.some((p) => removed.has(p.id) || p.memberIds?.some((id) => removed.has(id)))) return null;
  const remaining = participants.flatMap((p) => {
    if (!p.memberIds) return removed.has(p.id) ? [] : [p];
    const members = p.memberIds.map((id, index) => ({ id, name: p.memberNames?.[index] ?? '' }))
      .filter((member) => !removed.has(member.id));
    if (!members.length) return [];
    const memberIds = members.map((member) => member.id);
    const nextId = p.memberIds[p.nextMemberIndex ?? 0];
    const activeMemberId = p.activeMemberId && memberIds.includes(p.activeMemberId) ? p.activeMemberId : memberIds[0];
    const nextMemberIndex = Math.max(0, memberIds.indexOf(nextId));
    return [{ ...p, memberIds, memberNames: members.map((member) => member.name), activeMemberId, nextMemberIndex }];
  });
  const active = participants[turn];
  const activeStillHere = !!active && remaining.some((p) => p.id === active.id);
  const activeSeatRemoved = !!active?.activeMemberId && removed.has(active.activeMemberId);
  const countering = participants.find((p) => p.id === counteringId);
  const counterSeatRemoved = !!countering?.activeMemberId && removed.has(countering.activeMemberId);

  // Ohne Runde oder ohne Verbliebene (Mindestanzahl regelt der Wrapper) nur den Roster kürzen.
  if (!IN_ROUND.includes(phase) || remaining.length === 0) {
    const idx = active ? remaining.findIndex((p) => p.id === active.id) : -1;
    return { participants: remaining, turn: Math.max(0, idx), kind: 'keep' };
  }

  if (!active || !activeStillHere || (activeSeatRemoved && phase !== 'reveal')) {
    if (activeStillHere && activeSeatRemoved) {
      return { participants: remaining, turn: remaining.findIndex((p) => p.id === active.id), kind: 'restartTurn', returnSong: true };
    }
    // Nächste noch anwesende Person nach der aktiven, im Uhrzeigersinn.
    let next = remaining[0];
    for (let k = 1; k <= participants.length; k++) {
      const cand = participants[(turn + k) % participants.length];
      const survivor = remaining.find((p) => p.id === cand.id);
      if (survivor) { next = survivor; break; }
    }
    const nextTurn = remaining.indexOf(next);
    if (phase === 'reveal') {
      // Karte ist schon gewertet (ggf. an die Konternde) → wie „Weiter".
      const won = remaining.find((p) => hasWon(p, winTarget));
      if (won) return { participants: remaining, turn: nextTurn, kind: 'gameOver', winnerId: won.id };
      return { participants: remaining, turn: nextTurn, kind: 'restartTurn', returnSong: false };
    }
    return { participants: remaining, turn: nextTurn, kind: 'restartTurn', returnSong: true };
  }

  const nextTurn = remaining.findIndex((p) => p.id === active.id);
  const canStillCounter = remaining.some((p) => p.id !== active.id && p.hooks >= 1);
  if (phase === 'counterPlace' && counteringId && (!remaining.some((p) => p.id === counteringId) || counterSeatRemoved)) {
    return { participants: remaining, turn: nextTurn, kind: canStillCounter ? 'reopenCounter' : 'resolveNoCounter' };
  }
  if ((phase === 'counter') && !canStillCounter) {
    return { participants: remaining, turn: nextTurn, kind: 'resolveNoCounter' };
  }
  return { participants: remaining, turn: nextTurn, kind: 'keep' };
}
