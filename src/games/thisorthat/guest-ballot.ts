/**
 * This-or-That with 🔁 guests (guestPolicy 'sequential'): everyone with an own
 * phone votes at once; the seats on the host phone vote one after another,
 * each on a fresh ballot. Pure so the host flow and tests share one rule.
 */
export type Choice = 'A' | 'B';

/** Next seat on this device that still has to vote (own seat first), or null when all local seats voted. */
export function nextLocalVoter(localSeats: readonly string[], players: readonly { id: string }[], votes: Readonly<Record<string, Choice>>): string | null {
  return localSeats.find(id => players.some(player => player.id === id) && !votes[id]) ?? null;
}

/** Every remaining player has voted. */
export function ballotComplete(players: readonly { id: string }[], votes: Readonly<Record<string, Choice>>): boolean {
  return players.length > 0 && players.every(player => !!votes[player.id]);
}

/** Drop removed players and their ballots. Null when nobody in the game was removed. */
export function dropVoters<P extends { id: string }>(players: readonly P[], votes: Readonly<Record<string, Choice>>, removed: readonly string[]):
  { players: P[]; votes: Record<string, Choice> } | null {
  const gone = new Set(removed);
  if (!players.some(player => gone.has(player.id))) return null;
  return { players: players.filter(player => !gone.has(player.id)),
    votes: Object.fromEntries(Object.entries(votes).filter(([id]) => !gone.has(id))) };
}

/**
 * While seats share a phone, who chose which side must not show before the
 * reveal (the next guest would see it on the TV). Counts stay visible.
 */
export function hideSidesWhileVoting(phase: string, players: readonly { controlledBy?: string }[]): boolean {
  return phase === 'voting' && players.some(player => !!player.controlledBy);
}

/**
 * Speed mode: the clock ran out. Everyone whose time it was gets a random pick;
 * 🔁 guests still queued on the host phone keep their ballot open — each gets a
 * full timer of their own after the handover (spec 7 'sequential').
 */
export function speedExpiry(players: readonly { id: string }[], votes: Readonly<Record<string, Choice>>, queuedGuests: readonly string[], pick: () => Choice):
  { votes: Record<string, Choice>; done: boolean } {
  const next = { ...votes };
  for (const player of players) if (!next[player.id] && !queuedGuests.includes(player.id)) next[player.id] = pick();
  return { votes: next, done: ballotComplete(players, next) };
}
