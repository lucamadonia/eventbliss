import { describe, expect, it } from 'vitest';
import { actorIsRemote, deviceOf, playsOnThisDevice, wordPressActiveId, wordPressActiveSeat, wordPressTvPlayers } from './guest-turns';

const room = [
  { id: 'host', name: 'Luca', avatar: '🦊', color: '#ff0000', isHost: true },
  { id: 'max', name: 'Max', avatar: '🎸', color: '#00ff00', controlledBy: 'host' },
  { id: 'lena', name: 'Lena', avatar: '🐙', color: '#0000ff' },
];

describe('wordpress guest turns', () => {
  it('finds the active seat by game id, else the room seat at that index', () => {
    expect(wordPressActiveId([{ id: 'max' }], 0)).toBe('max');
    expect(wordPressActiveId([{}, {}, {}], 2, room)).toBe('lena');
    expect(wordPressActiveId([], 5, room)).toBeNull();
  });

  it('only asks for the phone during a running turn', () => {
    expect(wordPressActiveSeat('playing', 'max')).toBe('max');
    expect(wordPressActiveSeat('roundEnd', 'max')).toBeNull();
    expect(wordPressActiveSeat('gameOver', 'max')).toBeNull();
  });

  it('maps a guest seat to the host phone', () => {
    expect(deviceOf('max', room)).toBe('host');
    expect(deviceOf('lena', room)).toBe('lena');
    expect(deviceOf(null, room)).toBeNull();
  });

  it('lets the host phone play its own and its guests seats', () => {
    expect(playsOnThisDevice('max', ['host', 'max'])).toBe(true);
    expect(playsOnThisDevice('lena', ['host', 'max'])).toBe(false);
    expect(playsOnThisDevice(null, ['host'])).toBe(false);
  });

  it('gives transport grace only to players on their own phone', () => {
    expect(actorIsRemote('lena', room, 'host')).toBe(true);
    expect(actorIsRemote('max', room, 'host')).toBe(false);
    expect(actorIsRemote('host', room, 'host')).toBe(false);
  });

  it('adds avatar and colour for the TV', () => {
    const tv = wordPressTvPlayers([{ id: 'max', name: 'Max', score: 3 }, { name: 'Lena', score: 1 }], room);
    expect(tv[0]).toEqual({ id: 'max', name: 'Max', score: 3, avatar: '🎸', color: '#00ff00' });
    expect(tv[1]).toMatchObject({ id: 'lena', avatar: '🐙', color: '#0000ff' });
  });
});
