/**
 * Which seat does the host device act for? Its own seat and every 🔁 guest it
 * controls (localPlayerIds) are valid actors. Pick the first one the rule allows
 * that has not used this action in the current turn — so after the host voted,
 * the next tap on the shared phone counts for the guest who now holds it.
 */
export function hostActor(seats: readonly string[], allow: (seat: string) => boolean, used: (seat: string) => boolean): string | undefined {
  return seats.find(seat => allow(seat) && !used(seat));
}
