import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Wahrheit oder Pflicht: Karte zur Wahl (wer dran ist, ist oeffentlich), Ton
 * zur Aufgabe (die Karte selbst ist der Moment), Karte zur Abstimmung.
 * Nie Aufgabentext, nie einzelne Stimmen.
 */
function activeName(s: Record<string, unknown>) {
  const players = Array.isArray(s.players) ? s.players : [];
  return str((players[num(s.activeIdx, 0)] as Record<string, unknown> | undefined)?.name);
}

const truthdare: CueFn = (phase, s) => {
  const round = num(s.currentRound, 1);
  const idx = num(s.activeIdx, 0);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  const name = activeName(s);
  switch (phase) {
    case 'spin':
      return sound(`truthdare:${round}:spin`, 'tick', ACCENT.purple);
    case 'choice':
      return card(`truthdare:${round}:${idx}:choice`, ACCENT.purple, 'chime', { key: 'tvCinema.truthdare.cueChoice', fallback: 'Wahrheit oder Pflicht?' }, {
        eyebrow,
        ...(name ? { subtitle: { key: 'tvCinema.truthdare.cueChoiceSub', fallback: '{{name}} ist dran', params: { name } } } : {}),
      });
    case 'reveal':
      return sound(`truthdare:${round}:${idx}:reveal`, 'reveal', ACCENT.red);
    case 'vote':
      return card(`truthdare:${round}:${idx}:vote`, ACCENT.green, 'tick', { key: 'tvCinema.truthdare.cueVote', fallback: 'Abstimmung' }, {
        eyebrow,
        subtitle: name
          ? { key: 'tvCinema.truthdare.cueVoteSub', fallback: 'Hat {{name}} es geschafft?', params: { name } }
          : { key: 'tvCinema.truthdare.cueVoteSubAnon', fallback: 'Geschafft oder nicht?' },
      });
    case 'gameOver':
      return sound('truthdare:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { truthdare };
