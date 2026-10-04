import { ACCENT, card, num, roundEyebrow, sound, type CueFn } from './cue-kit';
import { stableCue } from './stable';

/**
 * NAH DRAN: Karte zu jeder Schaetzfrage, Aufloesung als Ton. Weder Wahrheit
 * noch Tipps auf der Karte — beides kommt erst mit der Aufloesung.
 */
const closeEnough: CueFn = stableCue((phase, s) => {
  const round = num(s.round, 1);
  switch (phase) {
    case 'guessing':
      return card(`closeenough:${round}:guessing`, ACCENT.amber, 'chime', { key: 'tvCinema.closeenough.guessing', fallback: 'Schätzt!' },
        { eyebrow: roundEyebrow(round, num(s.totalRounds, 0)), subtitle: { key: 'tvCinema.closeenough.guessingSub', fallback: 'Tippt eure Zahl ins Handy – wer kommt am nächsten?' } });
    case 'reveal':
      return sound(`closeenough:${round}:reveal`, 'reveal', ACCENT.green);
    default:
      return null;
  }
});

export const cues = { closeenough: closeEnough };
