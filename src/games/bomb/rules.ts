export function speedFuseMs(minSeconds: number, maxSeconds: number, reductionMs: number) {
  const min = Math.max(5000, minSeconds * 1000 - reductionMs);
  return { min, max: Math.max(min, 8000, maxSeconds * 1000 - reductionMs) };
}

/** Answer keys belong to the host until play has ended. */
export function publicBombState<T extends { phase: string; currentQuiz: { correctIndex: number } | null }>(state: T): T {
  return state.phase === 'playing' && state.currentQuiz
    ? { ...state, currentQuiz: { ...state.currentQuiz, correctIndex: -1 } }
    : state;
}

/** Shared ranks for ties: 1, 1, 3 — plain numbers, no leading zeros. */
export function bombRanks(penalties: readonly number[]): number[] {
  return penalties.map(p => penalties.filter(other => other < p).length + 1);
}
