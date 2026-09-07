type SecretPlayer = { id: string; isImpostor: boolean; votedFor: string | null };
type SecretState = { players: SecretPlayer[]; phase: string; hideCategory: boolean; currentWordSet: { category: string; word: string } | null };
export function impostorSnapshotFor<T extends SecretState>(state: T, recipient: string) {
  const me = state.players.find(p => p.id === recipient);
  const revealed = ['reveal', 'bonusGuess', 'results'].includes(state.phase);
  return { ...state,
    players: state.players.map(p => ({ ...p,
      isImpostor: revealed || p.id === recipient ? p.isImpostor : false,
      votedFor: revealed ? p.votedFor : null,
    })),
    currentWordSet: state.currentWordSet ? {
      category: state.hideCategory ? '' : state.currentWordSet.category,
      word: me?.isImpostor && state.phase !== 'results' ? '' : state.currentWordSet.word,
    } : null,
  };
}
