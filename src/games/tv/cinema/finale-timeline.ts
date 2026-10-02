import { confettiBurst } from '@/lib/party-motion';

/**
 * Ablauf der Siegerehrung, gemessen ab dem gemeinsamen Szenenstart
 * (`startsAt` der Finale-Szene). Telefone zuenden ihr Konfetti bei
 * `startsAt + afterDrumrollMs` — der Fernseher enthuellt das Podest im selben
 * Moment. Ohne Szenenzeit zaehlt der Fernseher ab dem eigenen Einblenden.
 *
 * 0 Trommelwirbel → 1 Podest + Konfetti → 2 Auszeichnungen → 3 Endstand.
 */
export const FINALE_AT = [0, confettiBurst.afterDrumrollMs, confettiBurst.afterDrumrollMs + 1000, confettiBurst.afterDrumrollMs + 1700] as const;

export type FinaleBeat = 0 | 1 | 2 | 3;

/** Beat zu einem Zeitpunkt; vor dem Start (negativ) ist es der Trommelwirbel. */
export function finaleBeat(elapsedMs: number): FinaleBeat {
  if (elapsedMs >= FINALE_AT[3]) return 3;
  if (elapsedMs >= FINALE_AT[2]) return 2;
  if (elapsedMs >= FINALE_AT[1]) return 1;
  return 0;
}

/**
 * Was ein Fernseher beim Einblenden noch erlebt: die restlichen Beats als
 * Verzoegerung ab jetzt. `live` = der Moment des Podests liegt noch vorn —
 * nur dann Trommelwirbel, Fanfare und Konfetti. Wer spaeter einschaltet,
 * sieht sofort das fertige Bild, ohne nachgeholten Laerm.
 */
export function finaleSchedule(elapsedMs: number): { beat: FinaleBeat; live: boolean; next: { beat: FinaleBeat; inMs: number }[] } {
  const beat = finaleBeat(elapsedMs);
  const next = ([1, 2, 3] as const)
    .filter((b) => b > beat)
    .map((b) => ({ beat: b, inMs: Math.max(0, FINALE_AT[b] - elapsedMs) }));
  return { beat, live: beat === 0, next };
}
