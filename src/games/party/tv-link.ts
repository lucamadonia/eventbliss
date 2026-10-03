/**
 * tv-link.ts — which code the TV has to open.
 *
 * The app-wide TV broadcaster (useTVBroadcast) fixes its channel code when the
 * app starts. A party started afterwards carries its own session code; showing
 * that one sent the TV to a channel nobody broadcasts on ("Warte auf den Host").
 * The code shown must therefore be the one this phone really broadcasts on.
 */
export function partyTvLinkCode(broadcastCode: string | null | undefined, sessionCode: string | null | undefined): string | null {
  return broadcastCode || sessionCode || null;
}
