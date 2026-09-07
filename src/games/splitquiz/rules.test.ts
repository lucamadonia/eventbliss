import { describe, it, expect } from 'vitest';
import { partitionRoster, wagerPoints } from './rules';
import { splitQuizSnapshotFor } from './private-state';
describe('sealed team competition', () => {
  it('partitions each stable ID exactly once for odd/even rosters', () => {
    for (const count of [4, 5, 10]) {
      const ids = Array.from({length: count}, (_, i) => `id-${i}`);
      const [a,b] = partitionRoster(ids);
      expect([...a,...b]).toEqual(ids);
      expect(a.filter(id => b.includes(id))).toEqual([]);
    }
  });
  it('higher wagers risk a larger loss', () => {
    expect([1,2,3].map(bet => wagerPoints(false,bet))).toEqual([0,-100,-200]);
    expect([1,2,3].map(bet => wagerPoints(true,bet))).toEqual([100,200,300]);
  });
  it('does not expose the answer after only the first team commits', () => {
    const state = { phase:'handoff', activeTeamIdx:1, teamA:{players:['a']}, teamB:{players:['b']}, teamAnswered:[true,false], answerSplit:[[0,1],[0,2]], selectedAnswer:0, currentQuestion:{question:'Q',answers:['yes','no','maybe','other'],correct:0,category:'test'} };
    expect(splitQuizSnapshotFor(state,'a').currentQuestion?.correct).toBe(-1);
    expect(splitQuizSnapshotFor(state,'b').currentQuestion?.correct).toBe(-1);
    expect(splitQuizSnapshotFor({...state,phase:'reveal',teamAnswered:[true,true]},'a').currentQuestion?.correct).toBe(0);
  });
});
