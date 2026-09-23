/** Never use display names as identities: two friends may share the same name. */
export function controllerScores(gameId: string, state: Record<string, unknown>, participantIds: readonly string[]): Record<string, number> {
  const allowed = new Set(participantIds);
  const scores: Record<string, number> = {};
  const explicit = state.partyScoresById;
  if (explicit && typeof explicit === 'object' && !Array.isArray(explicit)) {
    for (const [id, value] of Object.entries(explicit)) if (allowed.has(id) && typeof value === 'number' && Number.isFinite(value)) scores[id] = value;
    return scores;
  }
  const players = Array.isArray(state.players) ? state.players.filter((p): p is Record<string, unknown> => !!p && typeof p === 'object') : [];
  const maximumPenalty = Math.max(0, ...players.map(p => typeof p.penalties === 'number' && Number.isFinite(p.penalties) ? p.penalties : 0));
  for (const player of players) {
    if (typeof player.id !== 'string' || !allowed.has(player.id)) continue;
    const value = gameId === 'bomb' && typeof player.penalties === 'number' ? maximumPenalty - player.penalties : player.score;
    if (typeof value === 'number' && Number.isFinite(value)) scores[player.id] = value;
  }
  return scores;
}
