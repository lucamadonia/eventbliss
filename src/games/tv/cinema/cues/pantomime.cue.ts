import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Ohne Worte: Titelkarte je Zug (Darsteller ist oeffentlich), Startton fuer
 * die Uhr, Fanfare zur Wertung. Der Begriff kommt gar nicht erst im Zustand an.
 */
const pantomime: CueFn = (phase, s) => {
  const round = num(s.round, 1);
  const team = num(s.activeTeamIdx, 0);
  const actor = str(s.actor);
  const key = `pantomime:${round}:${team}:${actor}`;
  switch (phase) {
    case 'turnStart':
      return card(`${key}:turn`, ACCENT.amber, 'chime', { key: 'tvCinema.pantomime.cueTurn', fallback: 'Nächster Zug' }, {
        eyebrow: roundEyebrow(round, num(s.totalRounds, 0)),
        subtitle: actor
          ? { key: 'tvCinema.pantomime.cueTurnSub', fallback: '{{name}} stellt dar', params: { name: actor } }
          : { key: 'tvCinema.pantomime.cueTurnSubAnon', fallback: 'Wer darstellt, schaut aufs Handy' },
      });
    case 'playing':
      return sound(`${key}:playing`, 'tick', ACCENT.amber);
    case 'turnSummary':
      return sound(`${key}:summary`, num(s.turnPoints, 0) > 0 ? 'fanfare' : 'wrong', ACCENT.green);
    case 'gameOver':
      return sound('pantomime:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { pantomime };
