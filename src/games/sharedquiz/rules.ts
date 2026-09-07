export function sharedRoundPoints(mode: 'chain' | 'allornothing', answers: number[], correct: number): number {
  if (answers.length !== 3) return 0;
  const count = answers.filter(answer => answer === correct).length;
  return mode === 'allornothing' ? (count === 3 ? 3 : 0) : count;
}
