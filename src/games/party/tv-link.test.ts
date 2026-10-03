import { describe, expect, it } from 'vitest';
import { partyTvLinkCode } from './tv-link';

describe('partyTvLinkCode', () => {
  it('sends the TV to the channel the phone broadcasts on, not the later session code', () => {
    // App started → broadcaster fixed on "AAAAAA"; the party created afterwards has "BBBBBB".
    expect(partyTvLinkCode('AAAAAA', 'BBBBBB')).toBe('AAAAAA');
  });
  it('falls back to the session code only when no broadcaster is mounted', () => {
    expect(partyTvLinkCode(undefined, 'BBBBBB')).toBe('BBBBBB');
    expect(partyTvLinkCode(null, null)).toBeNull();
  });
});
