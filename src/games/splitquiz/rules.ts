/** A single ordered roster always yields disjoint teams, including duplicate display names. */
export function partitionRoster(ids: string[]): [string[], string[]] {
  const unique = [...new Set(ids)];
  const middle = Math.ceil(unique.length / 2);
  return [unique.slice(0, middle), unique.slice(middle)];
}
export function wagerPoints(correct: boolean, bet: number): number {
  const stake = Math.max(1, Math.min(3, Math.trunc(bet)));
  return correct ? 100 * stake : 100 * (1 - stake);
}
