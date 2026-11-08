/** A buzzer follows the live room seat when a host guest takes over on a phone. */
export function canBuzzForSeat(
  players: readonly { id: string; controlledBy?: string }[], senderId: string, playerId: string,
): boolean {
  return players.some(player => player.id === playerId && (player.id === senderId || player.controlledBy === senderId));
}
