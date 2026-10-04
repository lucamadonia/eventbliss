import { describe, expect, it } from 'vitest';
import { movePartyPlayer } from './usePartySession';
import { createPartyPlayer, createPartySession } from '@/games/party/session-schema';

const session = () => { const s = createPartySession('s'); s.players = ['a', 'b', 'c'].map((id, i) => createPartyPlayer(id, id, i)); return s; };

describe('movePartyPlayer (turn order)', () => {
  it('moves a player up and down', () => {
    expect(movePartyPlayer(session(), 2, 0).players.map(p => p.id)).toEqual(['c', 'a', 'b']);
    expect(movePartyPlayer(session(), 0, 1).players.map(p => p.id)).toEqual(['b', 'a', 'c']);
  });
  it('keeps the session for no-op or out-of-range moves', () => {
    const s = session();
    expect(movePartyPlayer(s, 1, 1)).toBe(s);
    expect(movePartyPlayer(s, -1, 0)).toBe(s);
    expect(movePartyPlayer(s, 0, 3)).toBe(s);
  });
});
