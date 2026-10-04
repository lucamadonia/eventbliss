import { describe, expect, it } from 'vitest';
import { appendOnlineGuess, publicGuessRound, settleGuessesAfterRemoval } from './online-guesses';
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

it('keeps submitted pins, distances and target private until every guess is locked', () => {
  const location = {lat: 52, lng: 13};
  const guesses = [{playerId:'a',playerName:'A',playerColor:'red',lat:51,lng:12,distanceKm:150}];
  const live = publicGuessRound({phase:'guessing',guesses,location,countdown:5});
  expect(live).toEqual({phase:'guessing',guesses:[],location:null,countdown:5,submittedIds:['a']});
  const result = publicGuessRound({phase:'result',guesses,location});
  expect(result.guesses).toEqual(guesses);
  expect(result.location).toEqual(location);
});

describe('guess rounds after a mid-round removal', () => {
  const g = (playerId: string) => ({ playerId });
  it('closes the round when everyone remaining has already guessed', () => {
    expect(settleGuessesAfterRemoval([g('host'), g('gone')], [{ id: 'host' }])).toEqual({ guesses: [g('host')], complete: true });
    expect(settleGuessesAfterRemoval([g('host')], [{ id: 'host' }])).toEqual({ guesses: [g('host')], complete: true });
  });
  it('keeps waiting for remaining players but drops the removed pin', () => {
    expect(settleGuessesAfterRemoval([g('gone')], [{ id: 'host' }, { id: 'guest' }])).toEqual({ guesses: [], complete: false });
  });
  it('changes nothing while no pin is stale and guesses are still open', () => {
    expect(settleGuessesAfterRemoval([g('host')], [{ id: 'host' }, { id: 'guest' }])).toBeNull();
    expect(settleGuessesAfterRemoval([], [])).toBeNull();
  });
});
