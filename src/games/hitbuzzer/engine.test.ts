import { describe, expect, it } from 'vitest';
import { acceptBuzz, advanceRound, createMatch, DEFAULT_CONFIG, judgeBuzz, pauseListening, pointsAt, removePlayer, resumeListening, startListening, undoJudgement, updateElapsed, voidBuzz } from './engine';

const roster = [
  { id: 'a', name: 'Alex', color: '#df8eff', avatar: 'A', teamId: 'a' },
  { id: 'b', name: 'Bo', color: '#8ff5ff', avatar: 'B', teamId: 'b' },
];
const ready = () => startListening(createMatch(roster, DEFAULT_CONFIG, 'match', 'round-1'));

describe('Hit-Buzzer host rules', () => {
  it('freezes speed points at the first accepted buzz and rejects stale or competing buzzes', () => {
    const listening = updateElapsed(ready(), 7800);
    const claimed = acceptBuzz(listening, 'a', 'round-1', 1000);
    expect(claimed.claim).toEqual({ playerId: 'a', points: 86, expiresAt: 9000 });
    expect(acceptBuzz(claimed, 'b', 'round-1', 1001)).toBe(claimed);
    expect(acceptBuzz(listening, 'b', 'old-round', 1001)).toBe(listening);
    expect(pointsAt(35_000)).toBe(40);
  });

  it('penalizes a wrong answer once, locks the team, then lets another player buzz', () => {
    const first = acceptBuzz(ready(), 'a', 'round-1', 1000);
    const wrong = judgeBuzz(first, false, 'Artist', 'Song');
    expect(wrong.players.find(p => p.id === 'a')).toMatchObject({ score: -20, locked: true });
    expect(judgeBuzz(wrong, false, 'Artist', 'Song')).toBe(wrong);
    expect(acceptBuzz(wrong, 'a', 'round-1', 2000)).toBe(wrong);
    const second = acceptBuzz(wrong, 'b', 'round-1', 2000);
    const won = judgeBuzz(second, true, 'Artist', 'Song');
    expect(won.reveal).toEqual({ artist: 'Artist', title: 'Song', winnerId: 'b', delta: 100 });
    expect(advanceRound(won, 'round-2').round).toBe(2);
  });

  it('locks every member of a team on a wrong answer and keeps individual buzz identities', () => {
    const team = startListening(createMatch([{ ...roster[0], teamId: 'red' }, { ...roster[1], teamId: 'red' },
      { id: 'c', name: 'Cam', color: '#ff6b98', avatar: 'C', teamId: 'blue' }], DEFAULT_CONFIG, 'm', 'r'));
    const wrong = judgeBuzz(acceptBuzz(team, 'a', 'r', 0), false, 'A', 'B');
    expect(wrong.players.filter(p => p.teamId === 'red').every(p => p.locked && p.score === -20)).toBe(true);
    expect(acceptBuzz(wrong, 'b', 'r', 1)).toBe(wrong);
    expect(acceptBuzz(wrong, 'c', 'r', 1).claim?.playerId).toBe('c');
  });

  it('voids without penalty, removes an active seat, and ends at the configured target', () => {
    const claimed = acceptBuzz(ready(), 'a', 'round-1', 0);
    expect(voidBuzz(claimed).players[0].score).toBe(0);
    expect(removePlayer(claimed, 'a')).toMatchObject({ phase: 'finished', claim: null });
    const target = startListening(createMatch(roster, { ...DEFAULT_CONFIG, targetScore: 100 }, 'm', 'r'));
    const won = judgeBuzz(acceptBuzz(target, 'a', 'r', 0), true, 'A', 'B');
    expect(advanceRound(won, 'next').phase).toBe('finished');
  });

  it('closes all buzzers while the host pauses the audio', () => {
    const paused = pauseListening(updateElapsed(ready(), 4200));
    expect(acceptBuzz(paused, 'a', 'round-1', 5000)).toBe(paused);
    expect(resumeListening(paused)).toMatchObject({ phase: 'listening', elapsedMs: 4200 });
  });

  it('undoes a mistaken judgement without restoring a stale answer deadline', () => {
    const before = acceptBuzz(ready(), 'a', 'round-1', 1000);
    const wrong = judgeBuzz(before, false, 'Artist', 'Song');
    const restored = undoJudgement(wrong, before, 20_000);
    expect(restored).toMatchObject({ phase: 'answering', revision: wrong.revision + 1 });
    expect(restored.players[0]).toMatchObject({ score: 0, locked: false });
    expect(restored.claim?.expiresAt).toBe(28_000);
    expect(undoJudgement(advanceRound(judgeBuzz(restored, true, 'Artist', 'Song'), 'round-2'), before, 25_000)).toMatchObject({ round: 2 });
  });
});
