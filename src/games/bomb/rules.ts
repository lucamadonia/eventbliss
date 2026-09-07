export function speedFuseMs(minSeconds: number, maxSeconds: number, reductionMs: number) {
  const min = Math.max(5000, minSeconds * 1000 - reductionMs);
  return { min, max: Math.max(min, 8000, maxSeconds * 1000 - reductionMs) };
}
