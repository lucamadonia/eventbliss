import { describe, expect, it } from 'vitest';
import { handoverDots, parseTvHandover } from './tv-handover';
import { buildRoster, lookupRoster } from './tv-roster';

describe('parseTvHandover', () => {
  const base = { playerId: 'max', name: 'Max', avatar: '🐯', color: '#00b894' };
  it('keeps public fields and validates progress', () => {
    const h = parseTvHandover({ ...base, progress: { doneIds: ['a', 'a', 'max'], currentId: 'max', queueIds: ['b', 'a'], phase: 'viewing' } });
    expect(h).toMatchObject({ playerId: 'max', name: 'Max', progress: { doneIds: ['a'], currentId: 'max', queueIds: ['b'], phase: 'viewing' } });
  });
  it('caps ids and drops unknown phases or bad colours', () => {
    const many = Array.from({ length: 30 }, (_, i) => `p${i}`);
    expect(parseTvHandover({ ...base, progress: { doneIds: many, currentId: 'max', queueIds: [], phase: 'viewing' } })?.progress?.doneIds).toHaveLength(12);
    expect(parseTvHandover({ ...base, progress: { doneIds: [], currentId: 'max', queueIds: [], phase: 'role:impostor' } })?.progress).toBeUndefined();
    expect(parseTvHandover({ ...base, color: 'red;x' })?.color).toBe('#df8eff');
    expect(parseTvHandover({ ...base, playerId: 'x'.repeat(200) })).toBeNull();
    expect(parseTvHandover(null)).toBeNull();
  });
  it('reads the optional next person', () => {
    expect(parseTvHandover({ ...base, next: { name: 'Gerda', avatar: '🎸', color: '#6c5ce7' } })?.next).toEqual({ name: 'Gerda', avatar: '🎸', color: '#6c5ce7' });
  });
});

describe('handoverDots', () => {
  it('orders done → current → queued without gaps', () => {
    expect(handoverDots({ doneIds: ['a'], currentId: 'b', queueIds: ['c'], phase: 'passing' }))
      .toEqual([{ id: 'a', state: 'done' }, { id: 'b', state: 'current' }, { id: 'c', state: 'queued' }]);
  });
  it('marks everyone done once the phone goes back to the host', () => {
    expect(handoverDots({ doneIds: ['a'], currentId: 'b', queueIds: [], phase: 'covered' }).every((d) => d.state === 'done')).toBe(true);
  });
});

describe('roster', () => {
  it('keeps the lobby emoji when a game state only knows name and colour', () => {
    const roster = buildRoster([{ id: 'l', name: 'Lena', avatar: '🦊', color: '#ff6b98' }], [{ id: 'l', name: 'Lena', color: '#000000' }]);
    expect(lookupRoster(roster, 'l')).toEqual({ name: 'Lena', avatar: '🦊', color: '#ff6b98' });
    expect(lookupRoster(roster, undefined, 'lena')?.avatar).toBe('🦊');
    expect(lookupRoster(roster, 'x')).toBeUndefined();
  });
});
