import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Wer bin ich: Karte beim Verteilen und einmal je Person am Zug (nicht vor
 * jeder Frage), Ton bei jeder Abstimmung, Karte vor dem Raten. Nie die Figur,
 * nie einzelne Antworten — nur Runde und der oeffentliche Name.
 */
function activePlayer(s: Record<string, unknown>) {
  const players = Array.isArray(s.players) ? s.players : [];
  const p = players[num(s.activeIdx, 0)] as Record<string, unknown> | undefined;
  return { name: str(p?.name), asked: num(p?.questionsAsked, 0) };
}

const whoami: CueFn = (phase, s) => {
  const round = num(s.currentRound, 1);
  const idx = num(s.activeIdx, 0);
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  const { name, asked } = activePlayer(s);
  switch (phase) {
    case 'assign':
      return card(`whoami:${round}:assign`, ACCENT.purple, 'reveal', { key: 'tvCinema.whoami.cueAssign', fallback: 'Figuren verteilen' },
        { eyebrow, subtitle: { key: 'tvCinema.whoami.cueAssignSub', fallback: 'Jeder bekommt eine geheime Figur' } });
    case 'asking':
      return card(`whoami:${round}:${idx}:turn`, ACCENT.cyan, 'chime', { key: 'tvCinema.whoami.cueTurn', fallback: 'Wer bin ich?' }, {
        eyebrow,
        subtitle: name
          ? { key: 'tvCinema.whoami.cueTurnSub', fallback: '{{name}} stellt Ja/Nein-Fragen', params: { name } }
          : { key: 'tvCinema.whoami.cueTurnSubAnon', fallback: 'Ja/Nein-Fragen stellen' },
      });
    case 'answerVote':
      return sound(`whoami:${round}:${idx}:${asked}:vote`, 'tick', ACCENT.cyan);
    case 'guessing':
      return card(`whoami:${round}:${idx}:${asked}:guess`, ACCENT.amber, 'reveal', { key: 'tvCinema.whoami.cueGuess', fallback: 'Jetzt wird geraten' }, {
        eyebrow,
        ...(name ? { subtitle: { key: 'tvCinema.whoami.cueGuessSub', fallback: '{{name}} nennt die Figur', params: { name } } } : {}),
      });
    case 'gameOver':
      return sound('whoami:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { whoami };
