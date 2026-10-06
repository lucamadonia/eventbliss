import { describe, expect, it } from 'vitest';
import {
  authorizeOhrwurmAction, canCounterAs, mayActFor, ohrwurmActingSeat, ohrwurmAudioHere, ohrwurmBeatPhase, ohrwurmTvPlayers,
  type OhrwurmActionContext,
} from './guest-turns';

const room = [
  { id: 'host' },
  { id: 'max', controlledBy: 'host' },
  { id: 'lena' },
];
const ctx = (over: Partial<OhrwurmActionContext> = {}): OhrwurmActionContext => ({
  phase: 'draw', activeId: 'max', counteringId: null, participantIds: ['host', 'max', 'lena'], room, ...over,
});

describe('ohrwurm guest turns', () => {
  it('lets a seat act itself or through the device that plays it', () => {
    expect(mayActFor('max', 'host', room)).toBe(true);
    expect(mayActFor('max', 'max', room)).toBe(true);
    expect(mayActFor('max', 'lena', room)).toBe(false);
    expect(mayActFor('lena', 'host', room)).toBe(false);
    expect(mayActFor(null, 'host', room)).toBe(false);
  });

  it('keeps the phone with the active seat for the whole turn, and with the counterer while placing', () => {
    for (const phase of ['draw', 'place', 'counter', 'reveal'] as const) expect(ohrwurmActingSeat(phase, 'max', null)).toBe('max');
    expect(ohrwurmActingSeat('counterPlace', 'max', 'host')).toBe('host');
    expect(ohrwurmActingSeat('setup', 'max', null)).toBeNull();
    expect(ohrwurmActingSeat('gameOver', 'max', null)).toBeNull();
  });

  it('accepts turn actions for a guest from the host phone only', () => {
    expect(authorizeOhrwurmAction({ type: 'listen' }, 'host', ctx())).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'listen' }, 'lena', ctx())).toBe(false);
    expect(authorizeOhrwurmAction({ type: 'place', slot: 0 }, 'host', ctx({ phase: 'place' }))).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'place', slot: 0 }, 'host', ctx())).toBe(false); // wrong phase
    expect(authorizeOhrwurmAction({ type: 'listen' }, 'stranger', ctx())).toBe(false);
  });

  it('authorizes the current team member instead of a synthetic team id', () => {
    const teams = ctx({
      phase: 'draw', activeId: 'team-a', participantIds: ['team-a', 'team-b'],
      seatByParticipant: { 'team-a': 'max', 'team-b': 'lena' },
    });
    expect(authorizeOhrwurmAction({ type: 'listen' }, 'host', teams)).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'listen' }, 'lena', teams)).toBe(false);
    expect(authorizeOhrwurmAction({ type: 'listen' }, 'team-a', teams)).toBe(false);
    expect(authorizeOhrwurmAction({ type: 'chooseCounter', pid: 'team-b' }, 'lena', { ...teams, phase: 'counter' })).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'chooseCounter', pid: 'team-a' }, 'host', { ...teams, phase: 'counter' })).toBe(false);
  });

  it('lets each device counter only for its own seats', () => {
    const c = ctx({ phase: 'counter', activeId: 'lena' });
    expect(authorizeOhrwurmAction({ type: 'chooseCounter', pid: 'max' }, 'host', c)).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'chooseCounter', pid: 'host' }, 'host', c)).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'chooseCounter', pid: 'max' }, 'lena', c)).toBe(false);
    expect(authorizeOhrwurmAction({ type: 'chooseCounter', pid: 'lena' }, 'lena', c)).toBe(false); // active can't counter
    expect(authorizeOhrwurmAction({ type: 'commitCounter', slot: 1 }, 'host', ctx({ phase: 'counterPlace', activeId: 'lena', counteringId: 'max' }))).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'commitCounter', slot: 1 }, 'lena', ctx({ phase: 'counterPlace', activeId: 'lena', counteringId: 'max' }))).toBe(false);
  });

  it('lets the guest step back through the host phone', () => {
    expect(authorizeOhrwurmAction({ type: 'back', to: 'draw' }, 'host', ctx({ phase: 'place' }))).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'back', to: 'draw' }, 'lena', ctx({ phase: 'place' }))).toBe(false);
    expect(authorizeOhrwurmAction({ type: 'back', to: 'counter' }, 'host', ctx({ phase: 'counterPlace', counteringId: 'max', activeId: 'lena' }))).toBe(true);
    expect(authorizeOhrwurmAction({ type: 'again' }, 'lena', ctx({ phase: 'gameOver' }))).toBe(true);
  });

  it('offers counter rows for the local seats only (all offline)', () => {
    expect(canCounterAs('max', 'lena', ['host', 'max'])).toBe(true);
    expect(canCounterAs('lena', 'max', ['host', 'max'])).toBe(false);
    expect(canCounterAs('max', 'max', ['host', 'max'])).toBe(false);
    expect(canCounterAs('lena', 'max', null)).toBe(true);
  });

  it('plays the sound on the device holding the active seat when there is no TV', () => {
    expect(ohrwurmAudioHere(false, true, 'x', [])).toBe(true);
    expect(ohrwurmAudioHere(true, false, 'max', ['host', 'max'])).toBe(true);
    expect(ohrwurmAudioHere(true, true, 'max', ['host', 'max'])).toBe(false);
    expect(ohrwurmAudioHere(true, false, 'lena', ['host', 'max'])).toBe(false);
  });

  it('keeps listening and placing on one beat', () => {
    expect(ohrwurmBeatPhase('place')).toBe('draw');
    expect(ohrwurmBeatPhase('counter')).toBe('counter');
  });

  it('builds a public TV roster without songs', () => {
    expect(ohrwurmTvPlayers([{ id: 'a', name: 'A', color: '#f00', avatar: '🦊', timeline: [{}, {}], hooks: 3 }]))
      .toEqual([{ id: 'a', name: 'A', color: '#f00', avatar: '🦊', score: 2, hooks: 3 }]);
  });
});
