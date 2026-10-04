/**
 * EMOJI-RATEN in Party-Play (sharedDevice 'turns'): one seat holds the puzzle at
 * a time, everybody else watches. A 🔁 guest of the host gets the host phone for
 * the whole turn (ready → playing → own result) and passes it straight on.
 * Pure so the host flow and the tests share one rule.
 */
export type EmojiPhase = 'ready' | 'setup' | 'playing' | 'reveal' | 'roundEnd' | 'gameOver';

const TURN_PHASES: readonly EmojiPhase[] = ['ready', 'playing', 'reveal'];

/** Seat that must hold the phone now: the puzzle holder, through to his own result. */
export function emojiActiveSeat(phase: EmojiPhase, players: readonly { id: string }[], currentPlayerIdx: number): string | null {
  return TURN_PHASES.includes(phase) ? players[currentPlayerIdx]?.id ?? null : null;
}

/** This device plays the current turn: local play, its own seat, or the 🔁 guest that confirmed the handover. */
export function emojiIsHolder(online: { myPlayerId: string } | undefined, holderId: string | undefined, activeGuest: string | null): boolean {
  if (!online) return true;
  if (!holderId) return false;
  return holderId === online.myPlayerId || holderId === activeGuest;
}

/** Party colour wins online (same light on TV and phone); local play keeps the game palette. */
export function emojiStartPlayers<P extends { id: string; name: string; color: string; avatar: string }>(
  setup: readonly P[], palette: readonly string[], online: boolean,
): (P & { score: number; streak: number; team: number })[] {
  return setup.map((p, i) => ({
    ...p,
    color: online && p.color ? p.color : palette[i % palette.length],
    score: 0,
    streak: 0,
    team: i % 2, // fixed at start: a removal mid-match never moves anyone to the other team
  }));
}

export interface EmojiRevealCard<Puzzle, Seat> { round: number; holder: Seat | null; puzzle: Puzzle; points: number }

/**
 * The reveal screen stays on screen ~600 ms after the host already drew the next
 * puzzle (synced phase gate). Freeze what was revealed so the NEXT answer never
 * flashes up in the old reveal.
 */
export function emojiRevealCard<Puzzle, Seat>(prev: EmojiRevealCard<Puzzle, Seat> | null, phase: EmojiPhase,
  current: { round: number; holder: Seat | null; puzzle: Puzzle | null; points: number }): EmojiRevealCard<Puzzle, Seat> | null {
  if (phase === 'setup') return null;
  if (phase !== 'reveal' || !current.puzzle) return prev;
  return { round: current.round, holder: current.holder, puzzle: current.puzzle, points: current.points };
}

interface TvPuzzle { emojis: string; category: string; answer: string }

/** TV payload: emojis while guessing, the answer only in the reveal — never before. */
export function emojiTvPuzzle(phase: EmojiPhase, puzzle: TvPuzzle | null): TvPuzzle {
  const shown = phase !== 'ready' && phase !== 'setup';
  return {
    emojis: shown ? puzzle?.emojis ?? '' : '',
    category: shown ? puzzle?.category ?? '' : '',
    answer: phase === 'reveal' ? puzzle?.answer ?? '' : '',
  };
}

/** Full identity for the TV cards (id, name, avatar, colour) plus the live score. */
export function emojiTvPlayers(players: readonly { id: string; name: string; avatar: string; color: string; score: number; team?: number }[]) {
  return players.map(({ id, name, avatar, color, score, team }) => ({ id, name, avatar, color, score, team }));
}
