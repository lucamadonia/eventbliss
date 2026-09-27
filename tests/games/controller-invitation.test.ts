import { describe, expect, it, vi } from 'vitest';
import { controllerInvitationCode, invitationAction, switchConfirmedParty } from '@/components/native/party/controller-invitation';

describe('native controller invitations', () => {
  it('keeps a warm invitation to B pending confirmation while A remains active', () => {
    const code = controllerInvitationCode('/party/join/bcdefg');
    expect(code).toBe('BCDEFG');
    expect(invitationAction(code!, 'ABCDEF', false)).toBe('confirm');
    expect(invitationAction('ABCDEF', 'ABCDEF', false)).toBe('none');
  });
  it('waits for an in-flight cold restore before offering to leave A for B', () => {
    expect(invitationAction('BCDEFG', undefined, true)).toBe('wait');
    expect(invitationAction('BCDEFG', 'ABCDEF', true)).toBe('wait');
    expect(invitationAction('BCDEFG', 'ABCDEF', false)).toBe('confirm');
  });
  it('joins B after a failed restore clears busy instead of marking it attempted prematurely', () => {
    expect(invitationAction('BCDEFG', undefined, true)).toBe('wait');
    expect(invitationAction('BCDEFG', undefined, false)).toBe('join');
  });
  it('does not treat normal navigation or cancellation as a replacement invitation', () => {
    expect(controllerInvitationCode('/party/controllers')).toBeNull();
    expect(controllerInvitationCode('/games/bomb')).toBeNull();
    expect(invitationAction(undefined, 'ABCDEF', false)).toBe('none');
  });
  it('awaits successful authoritative leave/end before joining the replacement', async () => {
    let finish!: () => void;
    const leave = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const join = vi.fn().mockResolvedValue(undefined);
    const switching = switchConfirmedParty(leave, join);
    expect(leave).toHaveBeenCalledOnce();
    expect(join).not.toHaveBeenCalled();
    finish(); await switching;
    expect(join).toHaveBeenCalledOnce();
  });
  it('preserves the previous party when authoritative leave/end fails', async () => {
    const join = vi.fn();
    await expect(switchConfirmedParty(async () => { throw new Error('offline'); }, join)).rejects.toThrow('offline');
    expect(join).not.toHaveBeenCalled();
  });
});
