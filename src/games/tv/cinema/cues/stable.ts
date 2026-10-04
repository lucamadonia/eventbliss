import type { CueFn, TVPhaseCue } from './cue-kit';

/**
 * Gleicher Cue → dasselbe Objekt.
 *
 * TVPhaseCard haengt seinen Effekt an die Objekt-Identitaet des Cues. Spiele
 * mit laufender Uhr senden jede Sekunde einen neuen Zustand; ein jedes Mal neu
 * gebautes Cue-Objekt startet den Effekt neu, dessen Aufraeumen den
 * Ausblend-Timer der Karte loescht — die Titelkarte bliebe dann bis zum
 * naechsten Phasenwechsel stehen. Inhaltsgleiche Cues behalten deshalb ihre
 * Identitaet.
 */
export function stableCue(fn: CueFn): CueFn {
  let last: TVPhaseCue | null = null;
  let lastSig = '';
  return (phase, state) => {
    const cue = fn(phase, state);
    if (!cue) return null;
    const sig = JSON.stringify(cue);
    if (last && sig === lastSig) return last;
    last = cue;
    lastSig = sig;
    return cue;
  };
}
