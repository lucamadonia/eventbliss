import { describe, expect, it } from 'vitest';
import { brewActiveSeat, brewIsMyTurn, brewSenderOwnsTurn, brewTvPlayers, brewViewerId } from './guest-turns';

const room = [
  { id: 'host', name: 'Luca', avatar: '🦊', color: '#ff0000' },
  { id: 'max', name: 'Max', avatar: '🎸', color: '#00ff00', controlledBy: 'host' },
  { id: 'lena', name: 'Lena', avatar: '🐙', color: '#0000ff' },
];
const players = [{ id: 'host' }, { id: 'max' }, { id: 'lena' }];

describe('brew guest turns', () => {
  it('names the acting seat only while a round is running', () => {
    expect(brewActiveSeat('playing', players, 1)).toBe('max');
    expect(brewActiveSeat('gameOver', players, 1)).toBeNull();
    expect(brewActiveSeat('setup', players, 0)).toBeNull();
    expect(brewActiveSeat('playing', players, 9)).toBeNull();
  });

  it('accepts actions from the active seat or the device that plays their guest seat', () => {
    expect(brewSenderOwnsTurn('lena', 'lena', room)).toBe(true);
    expect(brewSenderOwnsTurn('max', 'host', room)).toBe(true);
    expect(brewSenderOwnsTurn('max', 'lena', room)).toBe(false);
    expect(brewSenderOwnsTurn('lena', 'host', room)).toBe(false);
    expect(brewSenderOwnsTurn(null, 'host', room)).toBe(false);
    expect(brewSenderOwnsTurn('lena', undefined, room)).toBe(false);
  });

  it('shows the confirmed guest as "me" on the host phone, never before the handover', () => {
    expect(brewViewerId('host', 'max')).toBe('max');
    expect(brewViewerId('host', null)).toBe('host');
    expect(brewIsMyTurn(true, 'max', 'host', null)).toBe(false);
    expect(brewIsMyTurn(true, 'max', 'host', 'max')).toBe(true);
    expect(brewIsMyTurn(true, 'host', 'host', null)).toBe(true);
    expect(brewIsMyTurn(true, 'lena', 'host', null)).toBe(false);
    expect(brewIsMyTurn(false, 'lena', null, null)).toBe(true);
  });

  it('gives the TV avatars and room colours for every seat', () => {
    const tv = brewTvPlayers([{ id: 'max', name: 'Max', color: '#111111', score: 2 }, { id: 'x', name: 'Zoe', color: '#222222', score: 0 }], room);
    expect(tv[0]).toEqual({ id: 'max', name: 'Max', color: '#00ff00', score: 2, avatar: '🎸' });
    expect(tv[1]).toEqual({ id: 'x', name: 'Zoe', color: '#222222', score: 0, avatar: 'Z' });
  });
});
