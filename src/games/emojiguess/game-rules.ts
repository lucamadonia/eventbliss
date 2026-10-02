export function normalizeEmojiAnswer(value: string) {
  return value.toLocaleLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}
export function matchesEmojiAnswer(answer: string, expected: string, aliases: readonly string[] = []) {
  const normalized = normalizeEmojiAnswer(answer);
  return !!normalized && [expected, ...aliases].some(candidate => normalized === normalizeEmojiAnswer(candidate));
}
/** Team of a seat: fixed at match start (`team`), else seat parity (old snapshots, local play). */
export const emojiTeamOf = (player: { team?: number } | undefined, seat: number): number => player?.team ?? seat % 2;
export function emojiTeamSizes(players: readonly { team?: number }[]): [number, number] {
  const a = players.filter((p, i) => emojiTeamOf(p, i) === 0).length;
  return [a, players.length - a];
}
/** Integer weights give unequal teams the same maximum score per full roster round. */
export function emojiPointsForTurn(points: number, actor: number, roster: number | readonly { team?: number }[], team: boolean): number {
  if (!team) return points;
  const sizes: [number, number] = typeof roster === 'number' ? [Math.ceil(roster / 2), Math.floor(roster / 2)] : emojiTeamSizes(roster);
  if (sizes[0] === sizes[1]) return points;
  const own = typeof roster === 'number' ? actor % 2 : emojiTeamOf(roster[actor], actor);
  return points * Math.max(1, sizes[1 - own]);
}
export function awardEmojiPoints<T extends {score: number; streak: number; team?: number}>(players: T[], actor: number, points: number, team: boolean) {
  const actorTeam = emojiTeamOf(players[actor], actor);
  return players.map((p, i) => (team ? emojiTeamOf(p, i) === actorTeam : i === actor)
    ? { ...p, score: p.score + emojiPointsForTurn(points, actor, players, team), streak: points > 0 ? p.streak + 1 : 0 } : p);
}
export function publicEmojiPuzzle<T extends {answer: string; aliases?: string[]}>(puzzle: T | null, reveal: boolean, hint: boolean) {
  return !puzzle || reveal ? puzzle : { ...puzzle, aliases: [], answer: hint ? puzzle.answer.charAt(0) : '' };
}

/** Each player receives a turn; team membership only changes how points are shared. */
export function nextEmojiTurn(actor: number, round: number, rosterSize: number, totalRounds: number) {
  const nextPlayer = (actor + 1) % rosterSize;
  return { nextPlayer, round: round + (nextPlayer === 0 ? 1 : 0), finished: nextPlayer === 0 && round >= totalRounds };
}
export function emojiRoundBudget(requested: number, roster: number, puzzles: number) {
  return Math.max(1, Math.min(requested, Math.floor(puzzles / Math.max(1, roster))));
}
