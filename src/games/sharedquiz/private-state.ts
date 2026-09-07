type SharedState = { mode?: string; teamAnswers?: number[]; phase: string; players: { id: string }[]; roleIndices: number[]; currentQ: { question: string; answers: string[]; correctIndex: number; hint: string; category: string } | null };
export function sharedQuizSnapshotFor<T extends SharedState>(state: T, recipient: string) {
  if (!state.currentQ || ['reveal', 'gameOver'].includes(state.phase)) return state;
  if (state.mode && state.mode !== 'trio') return { ...state, teamAnswers: state.teamAnswers?.map(() => -1), currentQ: { ...state.currentQ, correctIndex: -1 } };
  const seat = state.players.findIndex(p => p.id === recipient);
  const role = state.roleIndices.indexOf(seat);
  return { ...state, currentQ: { ...state.currentQ,
    question: role === 0 ? state.currentQ.question : '',
    answers: state.currentQ.answers.map(answer => role === 1 ? answer : ''),
    hint: role === 2 ? state.currentQ.hint : '',
    category: '', correctIndex: -1,
  } };
}
