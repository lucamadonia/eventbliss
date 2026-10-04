import { num, roundEyebrow, card, sound, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/**
 * PIXELJAGD: Karte zu Beginn jedes Motivs, Aufloesung als Ton. Die Loesung ist
 * bis zur Aufloesung geheim — die Karte nennt nie das Motiv oder die Kategorie.
 */
const ACC = '#38BDF8';
const pixeljagd: CueFn = stableCue((phase, s) => {
  const round = num(s.round, 1);
  switch (phase) {
    case 'playing':
      return card(`pixeljagd:${round}:playing`, ACC, 'chime', { key: 'tvCinema.pixeljagd.playing', fallback: 'Was ist das?' },
        { eyebrow: roundEyebrow(round, num(s.totalRounds, 0)), subtitle: { key: 'tvCinema.pixeljagd.playingSub', fallback: 'Buzzert, sobald ihr es erkennt' } });
    case 'roundEnd':
      return sound(`pixeljagd:${round}:reveal`, 'reveal', ACC);
    default:
      return null;
  }
});

export const cues = { pixeljagd };
