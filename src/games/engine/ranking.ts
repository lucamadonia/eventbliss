/** Competition ranking: equal scores share a place (1, 1, 3). */
export function rankPlayers<T extends { score: number }>(players: readonly T[]): (T & { rank: number })[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let rank = 1;
  return sorted.map((player, index) => {
    if (index > 0 && player.score !== sorted[index - 1].score) rank = index + 1;
    return { ...player, rank };
  });
}
