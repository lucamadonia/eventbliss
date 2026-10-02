import { ACCENT, card, num, roundEyebrow, sound, type CueFn } from './cue-kit';

/** Hochstapler: Rollen verteilen → Diskussion → Abstimmung, Trommelwirbel vor der Enthuellung. */
const impostor: CueFn = (phase, s) => {
  const round = num(s.round, 1);
  const eyebrow = roundEyebrow(round);
  switch (phase) {
    case 'wordReveal':
      return card(`impostor:${round}:roles`, ACCENT.purple, 'reveal', { key: 'tvCinema.impostor.roles', fallback: 'Rollen verteilen' },
        { eyebrow, subtitle: { key: 'tvCinema.impostor.rolesSub', fallback: 'Schaut heimlich auf eure Handys' } });
    case 'discussion':
      return card(`impostor:${round}:discussion`, ACCENT.amber, 'chime', { key: 'tvCinema.impostor.discussion', fallback: 'Diskussion' },
        { eyebrow, subtitle: { key: 'tvCinema.impostor.discussionSub', fallback: 'Ein Wort pro Person – verratet nicht zu viel' } });
    case 'voting':
      return card(`impostor:${round}:voting`, ACCENT.red, 'tick', { key: 'tvCinema.impostor.voting', fallback: 'Abstimmung' },
        { eyebrow, subtitle: { key: 'tvCinema.impostor.votingSub', fallback: 'Wer ist der Hochstapler?' } });
    case 'revealCountdown':
      return sound(`impostor:${round}:countdown`, 'drumroll', ACCENT.red);
    default:
      return null;
  }
};

export const cues = { impostor, hochstapler: impostor };
