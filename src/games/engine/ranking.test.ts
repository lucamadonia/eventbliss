import { describe, expect, it } from 'vitest';
import { rankPlayers } from './ranking';
describe('fair game results', () => {
  it('gives identical scores the same rank without inventing an individual winner', () => {
    expect(rankPlayers([30,30,30,30].map(score => ({score}))).map(p=>p.rank)).toEqual([1,1,1,1]);
  });
  it('preserves the number of competitors ahead of the next place', () => {
    const players=[{name:'C',score:4},{name:'A',score:9},{name:'B',score:9},{name:'D',score:0}];
    expect(rankPlayers(players).map(p=>[p.name,p.rank])).toEqual([['A',1],['B',1],['C',3],['D',4]]);
    expect(players[0].name).toBe('C');
  });
});
