export function normalizeGuess(text: string): string {
  return text.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/^(der|die|das|ein|eine|the|a|an)\s+/u, '')
    .replace(/[.!?,;:]+$/u, '').trim();
}
export function sealedGuesses<T>(phase: string, guesses: T[]): T[] {
  return phase === 'roundResult' || phase === 'gameOver' ? guesses : [];
}
export function completeDrawingRounds(requested: number, players: number): number {
  return Math.ceil(Math.max(1, requested) / Math.max(1, players)) * Math.max(1, players);
}
