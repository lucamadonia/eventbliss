import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/**
 * Drück das Wort: Titelkarte je Zug („Lena ist dran“) — der Spielerwechsel
 * passiert innerhalb der Phase 'playing', deshalb steckt der Spieler im
 * Schluessel. Zwischenstand als Ton. Nie Woerter, nie Treffer-Infos.
 */
const wordpress: CueFn = stableCue((phase, s) => {
  const round = num(s.round, 1);
  switch (phase) {
    case 'playing': {
      const idx = num(s.currentPlayerIndex, 0);
      const players = Array.isArray(s.players) ? s.players : [];
      const name = str((players[idx] as { name?: unknown } | undefined)?.name);
      return card(`wordpress:${round}:${idx}:turn`, ACCENT.purple, 'chime',
        name ? { key: 'tvCinema.wordpress.yourTurn', fallback: '{{name}} ist dran', params: { name } } : { key: 'tvCinema.wordpress.nextTurn', fallback: 'Nächster Zug' },
        { eyebrow: roundEyebrow(round, num(s.totalRounds, 0)), subtitle: { key: 'tvCinema.wordpress.turnSub', fallback: 'Tippe die richtigen Wörter – schnell!' } });
    }
    case 'roundEnd':
      return sound(`wordpress:${round}:standings`, 'chime', ACCENT.cyan);
    default:
      return null;
  }
});

export const cues = { wordpress };
