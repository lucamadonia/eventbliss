type Ballot = Record<string, unknown> & { playerId: string; choice: 'A' | 'B' };

/** Bind authenticated votes to one match and round; delayed votes never carry over. */
export function validBallot(data: Record<string, unknown>, turn: string, playerIds: string[]): data is Ballot {
  return data.type === 'vote' && data.turn === turn && typeof data.playerId === 'string'
    && data.playerId === data.__senderId && playerIds.includes(data.playerId)
    && (data.choice === 'A' || data.choice === 'B');
}
