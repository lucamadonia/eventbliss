import { describe, expect, it } from 'vitest';
import { appendOnlineGuess } from './online-guesses';
const players = [{ id: 'host', name: 'Host', color: 'red' }, { id: 'guest', name: 'Guest', color: 'blue' }];
const target = { lat: 47, lng: 8 };
describe('online map guesses without broadcast self echo', () => {
  it('records the local host and remote guest exactly once in either arrival order', () => {
    for (const ids of [['host', 'guest'], ['guest', 'host']]) {
      let result = appendOnlineGuess([], players, ids[0], 47, 8, target);
      result = appendOnlineGuess(result, players, ids[1], 48, 9, target);
      expect(result).toHaveLength(2);
      expect(result[0].distanceKm).toBe(0);
      expect(appendOnlineGuess(result, players, ids[0], 0, 0, target)).toBe(result);
    }
  });
  it('rejects outsiders and malformed coordinates before scoring', () => {
    expect(appendOnlineGuess([], players, 'outsider', 47, 8, target)).toEqual([]);
    for (const [lat, lng] of [[NaN, 8], [47, Infinity], [91, 0], [0, -181]]) {
      expect(appendOnlineGuess([], players, 'host', lat, lng, target)).toEqual([]);
    }
  });
});

it('does not turn a missed pin into a real zero-zero answer', () => {
  const missed = appendOnlineGuess([], players, 'host', 0, 0, {lat:0,lng:0}, false);
  expect(missed[0].distanceKm).toBe(20000);
  const submitted = appendOnlineGuess([], players, 'host', 0, 0, {lat:0,lng:0}, true);
  expect(submitted[0].distanceKm).toBe(0);
});
