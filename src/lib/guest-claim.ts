/**
 * Pending guest-event claim: when a guest creates an event without an account,
 * we persist the organizer invite_token on this device. After the guest
 * registers/logs in, the dashboard auto-claims the event (via the claim-invite
 * edge function) so they become the recognized organizer and keep full control.
 */
const KEY = "eventbliss_pending_claim";

export interface PendingClaim {
  slug: string;
  token: string;
}

export function savePendingClaim(c: { slug?: string | null; token?: string | null }): void {
  if (!c?.slug || !c?.token) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ slug: c.slug, token: c.token }));
  } catch {
    /* storage unavailable */
  }
}

export function getPendingClaim(): PendingClaim | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return o?.slug && o?.token ? (o as PendingClaim) : null;
  } catch {
    return null;
  }
}

export function clearPendingClaim(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
