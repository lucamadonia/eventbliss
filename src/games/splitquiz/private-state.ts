type SplitState = { phase: string; activeTeamIdx: number; teamA: { players: string[] }; teamB: { players: string[] }; teamAnswered: boolean[]; answerSplit: number[][]; selectedAnswer: number | null; currentQuestion: { question: string; answers: string[]; correct: number; category: string } | null };
export function splitQuizSnapshotFor<T extends SplitState>(state: T, recipientName: string) {
  const team = state.teamA.players.includes(recipientName) ? 0 : state.teamB.players.includes(recipientName) ? 1 : -1;
  const active = team === state.activeTeamIdx;
  const answered = state.teamAnswered.every(Boolean) && state.phase === 'reveal';
  const visible = team >= 0 && (active || answered || state.phase === 'gameOver');
  return { ...state,
    answerSplit: state.answerSplit.map((indices, index) => index === team ? indices : []),
    selectedAnswer: active && answered ? state.selectedAnswer : null,
    currentQuestion: state.currentQuestion ? { ...state.currentQuestion,
      question: visible ? state.currentQuestion.question : '',
      answers: state.currentQuestion.answers.map((answer, index) => visible && (answered || state.answerSplit[team]?.includes(index)) ? answer : ''),
      correct: answered ? state.currentQuestion.correct : -1,
      category: visible ? state.currentQuestion.category : '',
    } : null,
  };
}
