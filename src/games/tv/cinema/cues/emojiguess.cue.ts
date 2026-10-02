import { ACCENT, card, num, roundEyebrow, sound, str, type CueFn } from './cue-kit';

/**
 * Emoji-Raten: Karte, wenn ein neuer Spieler an der Reihe ist (nur sein
 * oeffentlicher Name). Emojis, Kategorie-Hinweise und Loesung nie auf der Karte.
 */
const emojiguess: CueFn = (phase, s) => {
  const round = num(s.currentRound, num(s.round, 1));
  const idx = num(s.currentPlayerIdx, 0);
  const players = Array.isArray(s.players) ? s.players : [];
  const p = players[idx] as Record<string, unknown> | undefined;
  const name = p && typeof p === 'object' ? str(p.name) : '';
  const eyebrow = roundEyebrow(round, num(s.totalRounds, 0));
  switch (phase) {
    case 'ready':
      return card(`emoji:${round}:${idx}:ready`, ACCENT.purple, 'chime', { key: 'tvCinema.emojiGuess.title', fallback: 'Emoji-Rätsel' },
        name ? { eyebrow, subtitle: { key: 'tvCinema.emojiGuess.upNext', fallback: '{{name}} ist dran', params: { name } } } : { eyebrow });
    case 'playing':
      return sound(`emoji:${round}:${idx}:playing`, 'tick', ACCENT.purple);
    case 'reveal':
      return sound(`emoji:${round}:${idx}:reveal`, 'reveal', ACCENT.cyan);
    case 'gameOver':
      return sound('emoji:gameOver', 'fanfare', ACCENT.gold);
    default:
      return null;
  }
};

export const cues = { emojiguess };
