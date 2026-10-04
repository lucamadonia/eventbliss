import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/** Flaschendrehen: Karte = Ton (die Flasche ist der Moment), Abstimmung = Titelkarte. */
const bottle: CueFn = (phase, s) => {
  const round = num(s.currentRound ?? s.round, 1);
  if (phase === 'card') return sound(`bottle:${round}:card`, 'reveal');
  if (phase === 'vote') {
    const name = str(s.selectedName);
    return card(`bottle:${round}:vote`, ACCENT.green, 'tick', { key: 'tvCinema.bottle.vote', fallback: 'Abstimmung' }, {
      eyebrow: roundEyebrow(round),
      subtitle: name
        ? { key: 'tvCinema.bottle.voteSub', fallback: 'Hat {{name}} es geschafft?', params: { name } }
        : { key: 'tvCinema.bottle.voteSubAnon', fallback: 'Geschafft oder nicht?' },
    });
  }
  return null;
};

export const cues = { bottlespin: bottle, flaschendrehen: bottle };
