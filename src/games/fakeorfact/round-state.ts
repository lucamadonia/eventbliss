/** Answer keys and correctness remain host-only until the whole round is locked. */
export function publicQuizRound<T extends { phase: string; currentFact: any; currentThree: any; playerVote: unknown; playerThreeVote: unknown; votes: any[] }>(state: T): T {
  if (state.phase === 'reveal' || state.phase === 'gameOver') return state;
  return { ...state,
    currentFact: state.currentFact ? { ...state.currentFact, isTrue: null, explanation: '' } : null,
    currentThree: state.currentThree ? { ...state.currentThree, trueIndex: -1 } : null,
    playerVote: null, playerThreeVote: null,
    votes: state.votes.map(v => ({ playerId: v.playerId })),
  };
}

export function settleQuizRound<T extends { id: string; score: number; streak: number }>(players: T[], votes: { playerId: string; correct: boolean }[]): T[] {
  return players.map(p => { const correct = votes.find(v => v.playerId === p.id)?.correct === true;
    return { ...p, score: p.score + (correct ? 100 : 0), streak: correct ? p.streak + 1 : 0 };
  });
}
