export function advanceReveal(current: number, scheduled: number): number {
  return Math.max(current, scheduled);
}

/** A skipped sentence still consumes its place in the round. */
export function storyTurn(round: number, playerIndex: number, sentenceNumber: number, playerCount: number, sentencesPerPlayer: number): number {
  return (round - 1) * playerCount * sentencesPerPlayer + playerIndex * sentencesPerPlayer + sentenceNumber;
}
