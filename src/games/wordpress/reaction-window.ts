/** Client measures only visible, connected time; host still chooses and scores words. */
export const REACTION_TRANSPORT_GRACE_MS = 5000;
export function validReaction(elapsed: unknown, duration: number): elapsed is number {
  return typeof elapsed === 'number' && Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= duration + 50;
}
