import type { TVScore } from './useTVConnection';

/** Build a complete, render-safe TV leaderboard from a game's player list. */
export function tvLeaderboardScores(players: unknown, scoresById?: unknown): TVScore[] {
  if (!Array.isArray(players) || players.length === 0) return [];
  const mapped = scoresById && typeof scoresById === 'object' && !Array.isArray(scoresById)
    ? scoresById as Record<string, unknown>
    : null;
  const scores: TVScore[] = [];
  for (const value of players) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const player = value as Record<string, unknown>;
    const name = typeof player.name === 'string' ? player.name.trim() : '';
    const ownScore = player.score;
    const mappedScore = typeof player.id === 'string' ? mapped?.[player.id] : undefined;
    const score = typeof ownScore === 'number' && Number.isFinite(ownScore) ? ownScore : mappedScore;
    if (!name || typeof score !== 'number' || !Number.isFinite(score)) return [];
    scores.push({
      name,
      score,
      color: typeof player.color === 'string' && player.color ? player.color : '#df8eff',
    });
  }
  return scores.sort((a, b) => b.score - a.score);
}
