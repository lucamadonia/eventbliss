/**
 * Flaschendrehen with 🔁 guests (guestPolicy 'turns') and mid-game removals.
 * Pure so the host flow and tests share one rule.
 */
export type BottlePhase = 'setup' | 'spinning' | 'card' | 'vote' | 'gameOver';

/** Seat that must act now: the chosen player on the card, then each other player in turn to vote. */
export function bottleActiveSeat(phase: BottlePhase, players: readonly { id: string }[], selectedIdx: number, voterIdx: number): string | null {
  if (selectedIdx < 0) return null;
  if (phase === 'card') return players[selectedIdx]?.id ?? null;
  if (phase === 'vote') return players.filter((_, i) => i !== selectedIdx)[voterIdx]?.id ?? null;
  return null;
}

export interface BottleDrop<P> {
  players: P[];
  /** -1 when the chosen player left: the host skips the rest of that turn. */
  selectedIdx: number;
  voterIdx: number;
  skipTurn: boolean;
  /** All remaining voters have voted (the removed one was the last pending). */
  votingDone: boolean;
}

/** Remove kicked/left players and keep the turn on the same people. Null when nobody in the game was removed. */
export function dropBottlePlayers<P extends { id: string }>(players: readonly P[], selectedIdx: number, voterIdx: number, removed: readonly string[]): BottleDrop<P> | null {
  const gone = new Set(removed);
  if (!players.some(player => gone.has(player.id))) return null;
  const selected = players[selectedIdx];
  const next = players.filter(player => !gone.has(player.id));
  const skipTurn = !!selected && gone.has(selected.id);
  const voters = players.filter((_, i) => i !== selectedIdx);
  // Voters before the current one who are still here keep their place; the current voter (or the next one) is up.
  const nextVoterIdx = voters.slice(0, voterIdx).filter(voter => !gone.has(voter.id)).length;
  const remainingVoters = next.filter(player => player !== selected).length;
  return { players: next, selectedIdx: skipTurn || !selected ? -1 : next.indexOf(selected), voterIdx: nextVoterIdx,
    skipTurn, votingDone: !skipTurn && nextVoterIdx >= remainingVoters };
}
