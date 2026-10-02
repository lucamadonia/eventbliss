/** An OS invitation takes precedence over routing for a restored party. */
export function controllerInvitationCode(pathname: string): string | null {
  const match = /^\/party\/join\/([^/]+)\/?$/.exec(pathname);
  return match ? match[1].toUpperCase() : null;
}

export function invitationAction(inviteCode: string | undefined, currentCode: string | undefined, busy: boolean): 'wait' | 'join' | 'confirm' | 'none' {
  if (!inviteCode) return 'none';
  if (busy) return 'wait';
  if (!currentCode) return 'join';
  return inviteCode.toUpperCase() === currentCode.toUpperCase() ? 'none' : 'confirm';
}

/** Never join the replacement if leaving/ending the existing party failed. */
export async function switchConfirmedParty(leave: () => Promise<void>, join: () => Promise<unknown>): Promise<void> {
  await leave();
  await join();
}

/**
 * The invitation survives the login detour. `/auth?redirect=` covers the
 * e-mail flow; social sign-in and e-mail confirmation can come back on another
 * route, so the code is also parked here for 30 minutes (masterplan A03).
 */
const INVITE_KEY = 'eventbliss_pending_party_invite';
export const INVITE_TTL_MS = 30 * 60 * 1000;
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
type KeyValue = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultStorage = (): KeyValue | null => { try { return localStorage; } catch { return null; } };

export function rememberInvitation(code: string, now = Date.now(), storage = defaultStorage()): void {
  const upper = code.toUpperCase();
  if (!CODE.test(upper)) return;
  try { storage?.setItem(INVITE_KEY, JSON.stringify({ code: upper, at: now })); } catch { /* optional */ }
}

/** Returns and forgets a fresh parked invitation. */
export function takeInvitation(now = Date.now(), storage = defaultStorage()): string | null {
  try {
    const raw = storage?.getItem(INVITE_KEY);
    if (!raw) return null;
    storage?.removeItem(INVITE_KEY);
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const { code, at } = value as { code?: unknown; at?: unknown };
    if (typeof code !== 'string' || !CODE.test(code) || typeof at !== 'number' || now - at > INVITE_TTL_MS || at > now) return null;
    return code;
  } catch { return null; }
}

export function forgetInvitation(storage = defaultStorage()): void {
  try { storage?.removeItem(INVITE_KEY); } catch { /* optional */ }
}

/** Login target that brings the user straight back into the invitation. */
export function invitationLoginPath(inviteCode: string | undefined): string {
  const back = inviteCode ? `/party/join/${encodeURIComponent(inviteCode.toUpperCase())}` : '/party/controllers';
  return `/auth?redirect=${encodeURIComponent(back)}`;
}
