export function phaseAfterQuestion(questionsAsked: number, limit: number): 'asking' | 'guessing' {
  return questionsAsked + 1 >= limit ? 'guessing' : 'asking';
}
export function identityMatches(guess: string, identity: string): boolean {
  const normalize = (v: string) => v.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return normalize(guess).length > 0 && normalize(guess) === normalize(identity);
}
