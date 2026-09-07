import { it, expect } from 'vitest';
import { uniqueVoteLeader, impostorRoundPoints } from './round-rules';
it('a tied ballot never eliminates a player because of insertion order', () => {
  expect(uniqueVoteLeader({a:2,b:2})).toBe('');
  expect(uniqueVoteLeader({b:2,a:2})).toBe('');
  expect(uniqueVoteLeader({a:3,b:1})).toBe('a');
  expect(uniqueVoteLeader({})).toBe('');
});
it('scores a caught and a surviving impostor independently', () => {
  expect(impostorRoundPoints(true,'a','a',true)).toBe(0);
  expect(impostorRoundPoints(true,'b','a',true)).toBe(15);
  expect(impostorRoundPoints(false,'c','a',true)).toBe(10);
  expect(impostorRoundPoints(false,'c','',false)).toBe(0);
});
