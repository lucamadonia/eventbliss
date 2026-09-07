import { it, expect } from 'vitest';
import { completeTruth } from './scoring';
it('completing truth awards its point and truth count without altering dare results', () => {
  const before = {id:'a',score:4,truthCount:2,dareCount:3};
  expect(completeTruth(before)).toEqual({id:'a',score:5,truthCount:3,dareCount:3});
  expect(before.score).toBe(4);
});
