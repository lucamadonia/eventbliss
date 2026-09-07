/** A tied ballot eliminates nobody; guessing order never resolves a tie. */
export function uniqueVoteLeader(tally: Record<string, number>): string {
  const max = Math.max(0, ...Object.values(tally));
  const leaders = Object.keys(tally).filter(id => tally[id] === max);
  return max > 0 && leaders.length === 1 ? leaders[0] : '';
}
/** Civilians score for catching one impostor; each surviving impostor scores independently. */
export function impostorRoundPoints(isImpostor: boolean, id: string, caughtId: string, caught: boolean) {
  return isImpostor ? (id === caughtId && caught ? 0 : 15) : caught ? 10 : 0;
}
