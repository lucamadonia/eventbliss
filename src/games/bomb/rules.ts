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
