import { describe, expect, it } from 'vitest';
import { bombHolderId, bombHolderKind, bombSenderMayAct, bombTvHandover, bombTvPlayers, enterBombPhase } from './guest-turns';

const room = [
  { id: 'host', name: 'Luca', avatar: '🦊', color: '#ff0000' },
  { id: 'max', name: 'Max', avatar: '🎸', color: '#00ff00', controlledBy: 'host' },
  { id: 'lena', name: 'Lena', avatar: '🐙', color: '#0000ff' },
];

describe('bomb guest turns', () => {
  it('finds the holder by game id, falling back to the room seat at the same index', () => {
    expect(bombHolderId([{ id: 'max', name: 'Max' }], 0)).toBe('max');
    expect(bombHolderId([{ name: 'X' }, { name: 'Y' }], 1, room)).toBe('max');
    expect(bombHolderId([], 3, room)).toBeNull();
  });

  it('tells this phone whether to play, pass the phone, or wait', () => {
    expect(bombHolderKind('host', 'host', ['host', 'max'])).toBe('me');
    expect(bombHolderKind('max', 'host', ['host', 'max'])).toBe('pass');
    expect(bombHolderKind('lena', 'host', ['host', 'max'])).toBe('other');
    expect(bombHolderKind(null, 'host', ['host'])).toBe('other');
  });

  it('accepts answers from the holder or the device that plays their guest seat', () => {
    expect(bombSenderMayAct('lena', 'lena', room)).toBe(true);
    expect(bombSenderMayAct('max', 'host', room)).toBe(true);
    expect(bombSenderMayAct('max', 'lena', room)).toBe(false);
    expect(bombSenderMayAct('lena', 'host', room)).toBe(false);
    expect(bombSenderMayAct(null, 'host', room)).toBe(false);
    expect(bombSenderMayAct('lena', undefined, room)).toBe(false);
  });

  it('stamps a new phase with a shared start, but never re-stamps the same phase', () => {
    const s = { phase: 'playing', phaseStartsAt: 1 };
    expect(enterBombPhase(s, 'playing', () => 99)).toBe(s);
    expect(enterBombPhase(s, 'explosion', () => 99)).toEqual({ phase: 'explosion', phaseStartsAt: 99 });
  });

  it('gives the TV avatars and colours for every seat', () => {
    const tv = bombTvPlayers([{ id: 'max', name: 'Max', penalties: 1 }, { name: 'Lena', penalties: 0 }], room);
    expect(tv[0]).toEqual({ id: 'max', name: 'Max', penalties: 1, avatar: '🎸', color: '#00ff00' });
    expect(tv[1]).toMatchObject({ id: 'lena', avatar: '🐙' });
  });

  it('shows the host-phone hint only while a guest holds the bomb', () => {
    expect(bombTvHandover('max', room)).toEqual({ playerId: 'max', name: 'Max', avatar: '🎸', color: '#00ff00' });
    expect(bombTvHandover('lena', room)).toBeNull();
    expect(bombTvHandover(null, room)).toBeNull();
  });
});
