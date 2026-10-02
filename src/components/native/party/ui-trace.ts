import { useEffect } from 'react';
import { partyTraceDevice, pushPartyTrace, wallClockNow } from '@/games/party/party-trace';

export type PartyScreen = 'who-are-you' | 'profile' | 'lobby' | 'removed' | 'kick-sheet' | 'pending-claim' | 'switch-device' | 'ended';

/** QA harness: `{kind:'ui', screen, device, at}` in window.__partyPlayTrace when a party screen mounts. */
export function usePartyScreenTrace(screen: PartyScreen): void {
  useEffect(() => {
    pushPartyTrace({ kind: 'ui', screen, device: partyTraceDevice(), at: wallClockNow() });
  }, [screen]);
}
