/** Online statistics belong to the current participant, including shared wins. */
export function personalResult(players: readonly { id: string; score: number }[], myPlayerId?: string) {
  const valid = players.filter(player => Number.isFinite(player.score));
  const best = valid.length ? Math.max(...valid.map(player => player.score)) : 0;
  const player = myPlayerId ? valid.find(entry => entry.id === myPlayerId) : valid.find(entry => entry.score === best);
  return { score: player?.score ?? 0, won: !!player && player.score === best };
}
