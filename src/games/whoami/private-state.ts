import { identityMayBeRevealed } from './question-rules';

export function whoamiSnapshotFor<T extends { players: { id: string; character: string; guessedCorrectly?: boolean; eliminated?: boolean; questionsAsked?: number }[]; phase: string; activeIdx?: number; maxQ?: number }>(state: T, recipient: string) {
  return { ...state, players: state.players.map(p => ({ ...p,
    character: p.id === recipient && !(state.phase === 'gameOver' || (state.players[state.activeIdx ?? -1]?.id === p.id && identityMayBeRevealed(state.phase, p, state.maxQ))) ? '' : p.character,
  })) };
}
