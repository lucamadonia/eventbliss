import { describe, expect, it } from 'vitest';
import { acceptBuzz, advanceRound, canFinishAnswer, canJudgeClaim, createMatch, DEFAULT_CONFIG, extendAnswerDeadline, judgeBuzz, pauseListening, pointsAt, removePlayer, replaceBrokenClip, resumeListening, reviewBuzz, startListening, undoJudgement, updateElapsed, voidBuzz } from './engine';

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

  it('lets only the current claimant finish speaking before the deadline and then grade', () => {
    const claimed = acceptBuzz(ready(), 'a', 'round-1', 1000);
    expect(canFinishAnswer(claimed, 'a', 'round-1', 8999)).toBe(true);
    expect(canFinishAnswer(claimed, 'b', 'round-1', 2000)).toBe(false);
    expect(canFinishAnswer(claimed, 'a', 'old-round', 2000)).toBe(false);
    expect(canFinishAnswer(claimed, 'a', 'round-1', 9000)).toBe(true);
    expect(canFinishAnswer(claimed, 'a', 'round-1', 9700)).toBe(false);
    expect(canJudgeClaim(claimed, 'a', 'round-1', 8999)).toBe(false);
    const reviewing = reviewBuzz(claimed, 'a', 'round-1', 8999);
    expect(canJudgeClaim(reviewing, 'a', 'round-1', 12_000)).toBe(true);
    expect(canJudgeClaim(reviewing, 'b', 'round-1', 12_000)).toBe(false);
    expect(reviewBuzz(claimed, 'a', 'round-1', 9700)).toBe(claimed);
  });

  it('penalizes a wrong answer once, locks the team, then lets another player buzz', () => {
    const first = acceptBuzz(ready(), 'a', 'round-1', 1000);
    const wrong = judgeBuzz(first, false, 'Artist', 'Song');
    expect(wrong.players.find(p => p.id === 'a')).toMatchObject({ score: -20, locked: true });
    expect(wrong.attempts).toEqual([{ playerId: 'a', playerName: 'Alex', teamName: undefined, outcome: 'wrong', delta: -20 }]);
    expect(JSON.stringify(wrong)).not.toContain('Artist');
    expect(judgeBuzz(wrong, false, 'Artist', 'Song')).toBe(wrong);
    expect(acceptBuzz(wrong, 'a', 'round-1', 2000)).toBe(wrong);
    const second = acceptBuzz(wrong, 'b', 'round-1', 2000);
    const won = judgeBuzz(second, true, 'Artist', 'Song');
    expect(won.reveal).toEqual({ artist: 'Artist', title: 'Song', winnerId: 'b', delta: 100 });
    expect(won.history).toEqual([{ round: 1, artist: 'Artist', title: 'Song', attempts: [
      { playerId: 'a', playerName: 'Alex', teamName: undefined, outcome: 'wrong', delta: -20 },
      { playerId: 'b', playerName: 'Bo', teamName: undefined, outcome: 'correct', delta: 100 },
    ] }]);
    const next = advanceRound(won, 'round-2');
    expect(next.round).toBe(2);
    expect(next.attempts).toEqual([]);
    expect(next.history).toEqual(won.history);
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

  it('keeps the answer window intact after an online interruption', () => {
    const claimed = acceptBuzz(ready(), 'a', 'round-1', 1000);
    const resumed = extendAnswerDeadline(claimed, 6_500);
    expect(resumed.claim?.expiresAt).toBe(15_500);
    expect(resumed.revision).toBe(claimed.revision + 1);
    expect(extendAnswerDeadline(resumed, 0)).toBe(resumed);
    expect(extendAnswerDeadline(ready(), 6_500)).toMatchObject({ phase: 'listening' });
  });

  it('records an expired answer and reveals the song when no team can still buzz', () => {
    const first = judgeBuzz(acceptBuzz(ready(), 'a', 'round-1', 0), false, 'Artist', 'Song', true);
    expect(first.attempts[0].outcome).toBe('timeout');
    expect(first.reveal).toBeNull();
    const last = judgeBuzz(acceptBuzz(first, 'b', 'round-1', 9000), false, 'Artist', 'Song');
    expect(last.phase).toBe('result');
    expect(last.history[0].attempts.map(attempt => attempt.outcome)).toEqual(['timeout', 'wrong']);
  });

  it('lets the host check a spoken answer without a running answer deadline or leaking the song', () => {
    const claimed = acceptBuzz(ready(), 'a', 'round-1', 1000);
    const reviewing = reviewBuzz(claimed, 'a', 'round-1', 2000);
    expect(reviewing).toMatchObject({ phase: 'reviewing', claim: claimed.claim });
    expect(JSON.stringify(reviewing)).not.toContain('Artist');
    expect(acceptBuzz(reviewing, 'b', 'round-1', 2000)).toBe(reviewing);
    expect(extendAnswerDeadline(reviewing, 10_000)).toBe(reviewing);
    const judged = judgeBuzz(reviewing, true, 'Artist', 'Song');
    expect(judged).toMatchObject({ phase: 'result', reveal: { artist: 'Artist', title: 'Song' } });
    expect(undoJudgement(judged, reviewing, 30_000).phase).toBe('reviewing');
    expect(voidBuzz(reviewing)).toMatchObject({ phase: 'listening', claim: null });
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

  it('replaces a broken clip without spending the round or retaining its penalties', () => {
    const started = ready();
    const wrong = judgeBuzz(acceptBuzz(started, 'a', 'round-1', 0), false, 'A', 'B');
    const replaced = replaceBrokenClip(wrong, started, 'round-1-retry');
    expect(replaced).toMatchObject({ phase: 'loading', round: 1, roundId: 'round-1-retry', elapsedMs: 0 });
    expect(replaced.players[0]).toMatchObject({ score: 0, locked: false });
    expect(acceptBuzz(replaced, 'b', 'round-1', 1)).toBe(replaced);
    expect(replaceBrokenClip(removePlayer(wrong, 'b'), started, 'retry').players.map(p => p.id)).toEqual(['a']);
  });
});
