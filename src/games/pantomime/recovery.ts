/** In-progress turns restart; completed turns retain their unbooked score. */
export function recoverPantomimeTurn(snapshot: Record<string, unknown>) {
  const skipLimit = snapshot.skipLimit === null ? null
    : typeof snapshot.skipLimit === 'number' && Number.isInteger(snapshot.skipLimit) && snapshot.skipLimit >= 0
      ? snapshot.skipLimit : 3;
  const results = Array.isArray(snapshot.turnResults)
    ? snapshot.turnResults.filter((item): item is { word: string; result: 'correct' | 'skipped' } =>
      item && typeof item.word === 'string' && (item.result === 'correct' || item.result === 'skipped')) : [];
  const completed = snapshot.phase === 'turnSummary' && Array.isArray(snapshot.turnResults);
  return {
    skipLimit,
    phase: completed ? 'turnSummary' as const : 'turnStart' as const,
    turnResults: completed ? results : [],
    extraAccepted: completed && snapshot.extraAccepted === true,
  };
}
