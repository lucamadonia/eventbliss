import { describe, expect, it } from 'vitest';
import { resolveSeatAvatar } from './seat-avatar-resolve';

describe('resolveSeatAvatar', () => {
  const members = [{ player_id: 'lena', avatar: '🐙' }, { player_id: 'h', avatar: 'H' }];
  it('keeps a chosen emoji', () => expect(resolveSeatAvatar('🦊', 'x', members)).toBe('🦊'));
  it('replaces an initial with the party roster symbol', () => expect(resolveSeatAvatar('L', 'lena', members)).toBe('🐙'));
  it('never falls back to a letter', () => {
    const a = resolveSeatAvatar('H', 'h', members);
    expect(a).not.toMatch(/^[\p{L}\p{N}]{1,2}$/u);
    expect(resolveSeatAvatar(undefined, 'h', [])).toBe(a);
  });
});
