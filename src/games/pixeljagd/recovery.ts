/** Keep the clock and the first buzzer claim together across an offline reload. */
export function recoverPixelRound(snapshot: Record<string, unknown>, duration: number) {
  const time = snapshot.timeLeft;
  const buzzedBy = typeof snapshot.buzzedBy === 'string' ? snapshot.buzzedBy : null;
  return {
    timeLeft: typeof time === 'number' && Number.isFinite(time) ? Math.max(0, Math.min(duration, time)) : duration,
    buzzedBy,
    frozenPoints: buzzedBy && typeof snapshot.frozenPoints === 'number' && Number.isFinite(snapshot.frozenPoints)
      ? Math.max(10, Math.min(100, snapshot.frozenPoints)) : null,
    winnerId: typeof snapshot.winnerId === 'string' ? snapshot.winnerId : null,
    solutionShown: buzzedBy !== null && snapshot.solutionShown === true,
  };
}

type RosterPlayer = { id: string; name: string; readOnly?: boolean };
export function importPixelPlayers(players: RosterPlayer[], names: string[], makeId: (index: number) => string): RosterPlayer[] {
  const pending = names.map(name => name.trim()).filter(Boolean);
  let index = 0;
  const result = players.map(player => !player.readOnly && !player.name.trim() && index < pending.length
    ? { ...player, name: pending[index++] } : player);
  while (result.length < 8 && index < pending.length) {
    result.push({ id: makeId(index), name: pending[index++] });
  }
  return result;
}

export function validPixelAnswerAction(data: Record<string, unknown>, answerMode: string): boolean {
  if (data.type === 'buzz') return answerMode === 'buzzer';
  return data.type === 'text' && answerMode === 'text' && typeof data.text === 'string'
    && data.text.trim().length > 0 && data.text.length <= 200;
}
