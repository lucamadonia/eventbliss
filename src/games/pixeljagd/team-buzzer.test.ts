import { describe, expect, it } from 'vitest';
import { deviceOf, mayActFor, penalizeTeam, sharedPhoneTeams, teamOf, typistFor } from './team-buzzer';

const room = [
  { id: 'host' },
  { id: 'max', controlledBy: 'host' },
  { id: 'gerda', controlledBy: 'host' },
  { id: 'lena' },
];
const players = ['host', 'max', 'gerda', 'lena'].map(id => ({ id, score: 50, locked: false }));

describe('pixeljagd host-phone team', () => {
  it('maps guest seats to the host phone', () => {
    expect(deviceOf('max', room)).toBe('host');
    expect(deviceOf('lena', room)).toBe('lena');
    expect(teamOf('gerda', room).sort()).toEqual(['gerda', 'host', 'max']);
    expect(teamOf('lena', room)).toEqual(['lena']);
    expect(teamOf('solo', [])).toEqual(['solo']);
  });

  it('accepts a seat only from itself or the device that plays it', () => {
    expect(mayActFor('lena', 'lena', room)).toBe(true);
    expect(mayActFor('max', 'host', room)).toBe(true);
    expect(mayActFor('max', 'lena', room)).toBe(false);
    expect(mayActFor('lena', 'host', room)).toBe(false);
    expect(mayActFor(undefined, 'host', room)).toBe(false);
  });

  it('a wrong guess locks the whole phone but costs only the guesser', () => {
    const r = penalizeTeam(players, 'max', 25, room);
    expect(r.players.filter(p => p.locked).map(p => p.id).sort()).toEqual(['gerda', 'host', 'max']);
    expect(r.players.find(p => p.id === 'max')!.score).toBe(25);
    expect(r.players.find(p => p.id === 'host')!.score).toBe(50);
    expect(r.othersLeft).toBe(true);
    expect(penalizeTeam(r.players, 'lena', 25, room).othersLeft).toBe(false);
  });

  it('stays per-seat without a room (single phone)', () => {
    const r = penalizeTeam(players, 'max', 10, []);
    expect(r.players.filter(p => p.locked).map(p => p.id)).toEqual(['max']);
  });

  it('picks who types: the choice if free, else the first free local seat', () => {
    expect(typistFor('max', ['host', 'max'], players)).toBe('max');
    expect(typistFor(null, ['host', 'max'], players)).toBe('host');
    const locked = players.map(p => (p.id === 'host' ? { ...p, locked: true } : p));
    expect(typistFor('host', ['host', 'max'], locked)).toBe('max');
    expect(typistFor('host', ['host'], locked)).toBeNull();
  });

  it('lists shared phones for the TV', () => {
    expect(sharedPhoneTeams(room)).toEqual([['host', 'max', 'gerda']]);
    expect(sharedPhoneTeams([{ id: 'a' }])).toEqual([]);
  });
});
