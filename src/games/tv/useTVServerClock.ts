import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { serverClock } from '@/games/party/scene-clock';

const BURST = 3;
const BURST_GAP_MS = 200;
const RESYNC_MS = 30_000;
/** Annahme fuer den Notbehelf: so lange war der Zustand vom Telefon unterwegs (hin+zurueck). */
const STAMP_ASSUMED_RTT_MS = 120;

/**
 * Gemeinsame Uhr fuer den Fernseher (T-1).
 *
 * Hauptweg: echte Messung gegen die Serverzeit ueber `party_server_now()` —
 * anonym aufrufbar, mit echten Sende-/Empfangszeiten. Beim Start drei
 * Messungen im Abstand von 200 ms (die Uhr nimmt die mit der kuerzesten
 * Laufzeit), danach alle 30 s eine.
 *
 * Notbehelf, bis die erste echte Messung da ist: der vom Telefon gestempelte
 * `serverNow`. Seine Laufzeit ist nur geschaetzt — deshalb wird die Uhr bei der
 * ersten echten Messung zurueckgesetzt, sonst gewaenne die geschaetzte
 * (scheinbar kurze) Laufzeit dauerhaft gegen die echten.
 */
export function useTVServerClock(stampedServerNow: string | null): void {
  const realSyncRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const measure = async () => {
      const sent = Date.now();
      try {
        const { data, error } = await supabase.rpc('party_server_now' as never);
        const received = Date.now();
        if (cancelled || error || typeof data !== 'string') return;
        if (!realSyncRef.current) {
          realSyncRef.current = true;
          serverClock.reset();
        }
        serverClock.sample(data, sent, received);
      } catch {
        // Netz weg: die Uhr bleibt beim letzten guten Stand.
      }
    };
    for (let i = 0; i < BURST; i++) timers.push(window.setTimeout(measure, i * BURST_GAP_MS));
    const interval = window.setInterval(measure, RESYNC_MS);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!stampedServerNow || realSyncRef.current) return;
    const receivedAt = Date.now();
    serverClock.sample(stampedServerNow, receivedAt - STAMP_ASSUMED_RTT_MS, receivedAt);
  }, [stampedServerNow]);
}
