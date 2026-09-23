export function normalizeEmojiAnswer(value: string) {
  return value.toLocaleLowerCase().replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}
export function matchesEmojiAnswer(answer: string, expected: string, aliases: readonly string[] = []) {
  const normalized = normalizeEmojiAnswer(answer);
  return !!normalized && [expected, ...aliases].some(candidate => normalized === normalizeEmojiAnswer(candidate));
}
/** Integer weights give unequal teams the same maximum score per full roster round. */
export function emojiPointsForTurn(points: number, actor: number, roster: number, team: boolean): number {
  if (!team || roster % 2 === 0) return points;
  const otherTeamSize = actor % 2 === 0 ? Math.floor(roster / 2) : Math.ceil(roster / 2);
  return points * Math.max(1, otherTeamSize);
}
export function awardEmojiPoints<T extends {score: number; streak: number}>(players: T[], actor: number, points: number, team: boolean) {
  return players.map((p, i) => (team ? i % 2 === actor % 2 : i === actor)
    ? { ...p, score: p.score + emojiPointsForTurn(points, actor, players.length, team), streak: points > 0 ? p.streak + 1 : 0 } : p);
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
