/** A game's own reveal scene takes precedence over the generic TV scoreboard. */
export function showsGenericLeaderboard(game: string | undefined, phase: string | undefined): boolean {
  return phase === 'leaderboard' || (phase === 'roundEnd' && game !== 'pixeljagd');
}
