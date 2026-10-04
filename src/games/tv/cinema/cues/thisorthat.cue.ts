import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/** Dies oder Das: Karte je Runde, Diskussion, Aufloesung als Ton. */
const thisOrThat: CueFn = (phase, s) => {
  const round = num(s.round, 1);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  const a = str(s.optionA);
  const b = str(s.optionB);
  switch (phase) {
    case 'voting':
      return card(`tot:${round}:voting`, ACCENT.purple, 'chime', { key: 'tvCinema.thisOrThat.voting', fallback: 'Entscheidet euch!' },
        { eyebrow, ...(a && b ? { subtitle: { key: 'tvCinema.thisOrThat.votingSub', fallback: '{{a}} oder {{b}}?', params: { a, b } } } : {}) });
    case 'debate':
      return card(`tot:${round}:debate`, ACCENT.amber, 'chime', { key: 'tvCinema.thisOrThat.debate', fallback: 'Diskussion' },
        { eyebrow, subtitle: { key: 'tvCinema.thisOrThat.debateSub', fallback: 'Überzeugt die andere Seite' } });
    case 'reveal':
    case 'results':
      return sound(`tot:${round}:reveal`, 'reveal', ACCENT.cyan);
    default:
      return null;
  }
};

export const cues = { thisorthat: thisOrThat, 'this-or-that': thisOrThat };
