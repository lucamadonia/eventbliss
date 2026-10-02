/**
 * Who may receive an encrypted per-player snapshot (broadcastTo): only seats
 * with their own device. Never this device itself and never a 🔁 guest
 * (`controlledBy`): a guest's private view exists only on the device that
 * plays the seat and is shown there behind the handover reveal — sending it
 * would put e.g. a drawing word on the wire for a seat nobody owns.
 */
export function privateRecipients<P extends { id: string; controlledBy?: string }>(players: readonly P[], myPlayerId: string): P[] {
  return players.filter(player => player.id !== myPlayerId && !player.controlledBy);
}
