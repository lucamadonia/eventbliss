import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/** Name des Ratenden dieser Runde (oeffentlich) — aus Sitzen oder Namensliste. */
function guesserName(s: Record<string, unknown>, round: number): string {
  const seats = Array.isArray(s.playerSeats) ? s.playerSeats : [];
  const list = seats.length > 0 ? seats : Array.isArray(s.players) ? s.players : [];
  const p = list[round - 1] as unknown;
  if (typeof p === 'string') return p;
  return p && typeof p === 'object' ? str((p as { name?: unknown }).name) : '';
}

/**
 * HeadUp: Titelkarte „Lena ist dran“ vor jedem Zug, Start und Zug-Ende als Ton.
 * Nie der Begriff — nur Runde und oeffentlicher Name.
 */
const headup: CueFn = stableCue((phase, s) => {
  const round = num(s.currentRound ?? s.round, 1);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'ready': {
      const name = guesserName(s, round);
      return card(`headup:${round}:ready`, ACCENT.purple, 'chime',
        name ? { key: 'tvCinema.headup.yourTurn', fallback: '{{name}} ist dran', params: { name } } : { key: 'tvCinema.headup.nextTurn', fallback: 'Nächster Zug' },
        { eyebrow, subtitle: { key: 'tvCinema.headup.readySub', fallback: 'Handy an die Stirn, die anderen erklären' } });
    }
    case 'playing':
      return sound(`headup:${round}:go`, 'reveal', ACCENT.cyan);
    case 'roundResult':
      return sound(`headup:${round}:result`, 'chime', ACCENT.cyan);
    default:
      return null;
  }
});

export const cues = { headup };
