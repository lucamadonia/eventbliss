/** A TV is linked while its 'tv-ready' heartbeat is fresh (TV_STALE_MS in tv/useTVConnection). */
export function tvLinked(lastSeenAt: number, now: number, staleMs: number): boolean {
  return lastSeenAt > 0 && now - lastSeenAt <= staleMs;
}
