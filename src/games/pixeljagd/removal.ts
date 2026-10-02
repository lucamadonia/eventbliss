/**
 * Host-side roster cleanup when players leave or are kicked mid-match
 * (masterplan G7, F13/F14/F19). Pure, so the component only applies the result.
 */
export interface RemovalPlayer { id: string; locked: boolean }
export interface RemovalState<P extends RemovalPlayer> {
  phase: string;
  players: P[];
  buzzedBy: string | null;
}
export interface RemovalResult<P extends RemovalPlayer> {
  players: P[];
  /** The buzzing player left: release the buzz so the reveal continues. */
  clearBuzz: boolean;
  /** Nobody left who could still answer this round. */
  endRound: boolean;
}

/** Returns null when none of `removedIds` is in the game's roster. */
export function dropPixelPlayers<P extends RemovalPlayer>(state: RemovalState<P>, removedIds: string[]): RemovalResult<P> | null {
  const gone = new Set(removedIds);
  if (!state.players.some(p => gone.has(p.id))) return null;
  const players = state.players.filter(p => !gone.has(p.id));
  const playing = state.phase === 'playing';
  const clearBuzz = playing && state.buzzedBy !== null && gone.has(state.buzzedBy);
  const endRound = playing && players.length > 0 && players.every(p => p.locked);
  return { players, clearBuzz, endRound };
}
