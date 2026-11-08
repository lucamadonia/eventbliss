/**
 * Per-device storage for the `edit_token` that `submit-response` issues on
 * every save. Sending it back is how an anonymous guest proves they may
 * overwrite their own answer (otherwise the function answers 409
 * RESPONSE_EXISTS). Storage can be unavailable (private mode, blocked site
 * data) — every access is best-effort and never throws.
 */
const PREFIX = "eb:response-edit-token";

function keyFor(eventId: string, participant: string): string {
  return `${PREFIX}:${eventId}:${participant.trim().toLowerCase()}`;
}

export function loadEditToken(eventId: string, participant: string): string | undefined {
  if (!eventId || !participant?.trim()) return undefined;
  try {
    return window.localStorage.getItem(keyFor(eventId, participant)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveEditToken(eventId: string, participant: string, token: unknown): void {
  if (!eventId || !participant?.trim() || typeof token !== "string" || !token) return;
  try {
    window.localStorage.setItem(keyFor(eventId, participant), token);
  } catch {
    // Without storage the guest can still edit while logged in or via the organizer.
  }
}
