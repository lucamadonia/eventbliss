import { ACCENT, card, num, roundEyebrow, sound, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/**
 * Tickende Bombe: Titelkarte je Runde, Explosion und Zwischenstand als Ton.
 * Die Aufgabe ist zwar oeffentlich, gehoert aber nicht auf die Karte —
 * Karten tragen nur Runde und Phasenname.
 */
const bomb: CueFn = stableCue((phase, s) => {
  const round = num(s.round, 1);
  switch (phase) {
    case 'playing':
      return card(`bomb:${round}:playing`, ACCENT.red, 'reveal', { key: 'tvCinema.bomb.armed', fallback: 'Die Bombe tickt!' }, {
        eyebrow: roundEyebrow(round, num(s.totalRounds, 0)),
        subtitle: { key: 'tvCinema.bomb.armedSub', fallback: 'Antworten und schnell weitergeben' },
      });
    case 'explosion':
      return sound(`bomb:${round}:boom`, 'wrong', ACCENT.red);
    case 'roundEnd':
      return sound(`bomb:${round}:standings`, 'chime', ACCENT.cyan);
    default:
      return null;
  }
});

export const cues = { bomb };
