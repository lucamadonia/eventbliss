import { describe, expect, it, vi } from 'vitest';
import {
  controllerInvitationCode, forgetInvitation, invitationAction, invitationLoginPath, INVITE_TTL_MS,
  rememberInvitation, switchConfirmedParty, takeInvitation,
} from './controller-invitation';
import { getSafeAuthRedirect } from '@/lib/auth-redirect';

function memory() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); }, removeItem: (k: string) => { map.delete(k); } };
}

describe('controllerInvitationCode', () => {
  it('reads the code from the join path', () => {
    expect(controllerInvitationCode('/party/join/k7qm4x')).toBe('K7QM4X');
    expect(controllerInvitationCode('/party/join/K7QM4X/')).toBe('K7QM4X');
    expect(controllerInvitationCode('/party/controllers')).toBeNull();
  });
});

describe('invitationAction', () => {
  it('joins, waits, confirms a switch or ignores the same party', () => {
    expect(invitationAction(undefined, undefined, false)).toBe('none');
    expect(invitationAction('ABCDEF', undefined, true)).toBe('wait');
    expect(invitationAction('ABCDEF', undefined, false)).toBe('join');
    expect(invitationAction('abcdef', 'ABCDEF', false)).toBe('none');
    expect(invitationAction('ABCDEF', 'GHJKLM', false)).toBe('confirm');
  });
});

describe('switchConfirmedParty', () => {
  it('never joins when leaving failed', async () => {
    const join = vi.fn();
    await expect(switchConfirmedParty(() => Promise.reject(new Error('x')), join)).rejects.toThrow();
    expect(join).not.toHaveBeenCalled();
  });
});

describe('parked invitation (login detour)', () => {
  it('round-trips once', () => {
    const storage = memory();
    rememberInvitation('k7qm4x', 1000, storage);
    expect(takeInvitation(2000, storage)).toBe('K7QM4X');
    expect(takeInvitation(2000, storage)).toBeNull();
  });

  it('expires and rejects garbage', () => {
    const storage = memory();
    rememberInvitation('K7QM4X', 0, storage);
    expect(takeInvitation(INVITE_TTL_MS + 1, storage)).toBeNull();
    rememberInvitation('not a code', 0, storage);
    expect(takeInvitation(1, storage)).toBeNull();
    storage.setItem('eventbliss_pending_party_invite', '{broken');
    expect(takeInvitation(1, storage)).toBeNull();
  });

  it('can be forgotten', () => {
    const storage = memory();
    rememberInvitation('K7QM4X', 0, storage);
    forgetInvitation(storage);
    expect(takeInvitation(1, storage)).toBeNull();
  });

  it('login path returns to the same invitation and passes the redirect guard', () => {
    const path = invitationLoginPath('k7qm4x');
    const redirect = new URLSearchParams(path.split('?')[1]).get('redirect');
    expect(getSafeAuthRedirect(redirect)).toBe('/party/join/K7QM4X');
    expect(new URLSearchParams(invitationLoginPath(undefined).split('?')[1]).get('redirect')).toBe('/party/controllers');
  });
});
