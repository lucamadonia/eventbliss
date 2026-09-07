export function advanceReveal(current: number, scheduled: number): number {
  return Math.max(current, scheduled);
}
