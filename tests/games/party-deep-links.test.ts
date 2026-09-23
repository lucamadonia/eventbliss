import { describe, expect, it } from 'vitest';
import { deepLinkTarget } from '@/lib/deep-links';

describe('native party invitations', () => {
  it('preserves party route for universal and app links', () => {
    expect(deepLinkTarget('https://event-bliss.com/party/join/ABCDEF')).toBe('/party/join/ABCDEF');
    expect(deepLinkTarget('eventbliss://party/join/ABCDEF')).toBe('/party/join/ABCDEF');
  });
  it('retains the legacy room parameter in the native game stack', () => {
    expect(deepLinkTarget('https://event-bliss.com/games?room=ABCDEF&lang=de')).toBe('/games/bomb?room=ABCDEF&lang=de');
    expect(deepLinkTarget('eventbliss://join?code=ABCDEF&token=invite')).toBe('/join?code=ABCDEF&token=invite');
    expect(deepLinkTarget('app.eventbliss:///auth?type=recovery&code=private')).toBe('/auth?type=recovery');
  });
  it('ignores foreign origins and Spotify callbacks', () => {
    expect(deepLinkTarget('https://example.org/party/join/ABCDEF')).toBeNull();
    expect(deepLinkTarget('eventbliss://spotify-callback?token=private')).toBeNull();
    expect(deepLinkTarget('not-a-url')).toBeNull();
  });
});
