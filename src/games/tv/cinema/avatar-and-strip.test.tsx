import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { avatarFor, buildRoster, realAvatar } from './tv-roster';
import TVPartyProgressStrip from '../components/TVPartyProgressStrip';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, params: Record<string, unknown> = {}) =>
      fallback.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(params[k])),
  }),
}));

describe('realAvatar', () => {
  it('treats a bare initial as "no avatar" so the roster emoji wins', () => {
    expect(realAvatar('H')).toBeUndefined();
    expect(realAvatar('ä')).toBeUndefined();
    expect(realAvatar('HL')).toBeUndefined();
    expect(realAvatar('  ')).toBeUndefined();
    expect(realAvatar('🦊')).toBe('🦊');
    expect(realAvatar('👨‍👩‍👧')).toBe('👨‍👩‍👧');
  });

  it('prefers the party roster emoji over an initial from the game state', () => {
    const roster = buildRoster([{ id: 'h', name: 'Hanna', avatar: '🦊' }]);
    expect(avatarFor(roster, { id: 'h', name: 'Hanna', avatar: 'H' })).toBe('🦊');
    expect(avatarFor(roster, { id: 'x', name: 'Lukas', avatar: 'L' })).toBe('L');
  });

  it('never lets an initial from a game state occupy the roster', () => {
    const roster = buildRoster([{ id: 'h', name: 'Hanna', avatar: 'H' }], [{ id: 'h', name: 'Hanna', avatar: '🦊' }]);
    expect(roster.byId.get('h')?.avatar).toBe('🦊');
  });
});

describe('TVPartyProgressStrip', () => {
  const item = (gameId: string, done = false) => ({ gameId, name: gameId, done }) as never;

  it('is hidden when only one game is planned ("Spiel 1 von 1" says nothing)', () => {
    expect(renderToStaticMarkup(<TVPartyProgressStrip playlist={[item('bomb')]} index={0} />)).toBe('');
  });

  it('shows the position in sentence case, without tracked caps', () => {
    const html = renderToStaticMarkup(<TVPartyProgressStrip playlist={[item('a', true), item('b'), item('c')]} index={1} />);
    expect(html).toContain('Spiel 2 von 3');
    expect(html).not.toMatch(/uppercase|tracking-/);
  });
});
