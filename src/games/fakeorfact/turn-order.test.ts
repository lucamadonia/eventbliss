import { describe, it, expect } from 'vitest';
import { answeringSeat, clockHeldForTurn, deviceMayAnswer, localSeatResults, needsDeadlineCheck, recordAnswer, seatColor, turnMarks, tvAnswered } from './turn-order';

const seat = (id: string, color = '#123456') => ({ id, name: id.toUpperCase(), avatar: '🦊', color, score: 0, streak: 0 });
// Host phone 'host' plays its 🔁 guests 'g1' and 'g2'; 'p' has an own phone.
const players = [seat('host'), seat('g1'), seat('p'), seat('g2')];

describe('fake-or-fact turns with guests on the host phone', () => {
  it('names the seat in turn only while a statement is open', () => {
    expect(answeringSeat('statement', players, 1)).toBe('g1');
    expect(answeringSeat('reveal', players, 1)).toBeNull();
    expect(answeringSeat('handoff', players, 0)).toBeNull();
    expect(answeringSeat('statement', players, 9)).toBeNull();
  });

  it('lets the host phone answer for a guest only after the handover was confirmed', () => {
    expect(deviceMayAnswer('host', 'host', null)).toBe(true);
    expect(deviceMayAnswer('g1', 'host', null)).toBe(false); // phone still in transit / not requested yet
    expect(deviceMayAnswer('g1', 'host', 'g1')).toBe(true);
    expect(deviceMayAnswer('g2', 'host', 'g1')).toBe(false); // never for another guest
    expect(deviceMayAnswer('p', 'host', null)).toBe(false); // remote phone seat
    expect(deviceMayAnswer('p', 'p', null)).toBe(true); // phone-only play unchanged
    expect(deviceMayAnswer(null, 'host', null)).toBe(false);
  });

  it('marks progress without exposing what anyone chose', () => {
    const marks = turnMarks(players, [{ playerId: 'host', correct: true, answer: true }], 1, 'statement');
    expect(marks).toEqual([{ id: 'host', mark: 'done' }, { id: 'g1', mark: 'now' }, { id: 'p', mark: 'open' }, { id: 'g2', mark: 'open' }]);
    expect(JSON.stringify(marks)).not.toContain('correct');
    expect(turnMarks(players, [], 1, 'reveal').every(m => m.mark === 'open')).toBe(true);
  });

  it('credits each seat once — a double tap cannot answer for the next guest', () => {
    type V = { playerId: string; correct: boolean; answer: boolean | number | null };
    const first = recordAnswer<V>([], { playerId: 'g1', correct: true, answer: true });
    const again = recordAnswer(first, { playerId: 'g1', correct: false, answer: false });
    expect(again).toEqual([{ playerId: 'g1', correct: true, answer: true }]);
    expect(recordAnswer(again, { playerId: 'p', correct: false, answer: false }).map(a => a.playerId)).toEqual(['g1', 'p']);
  });

  it('checks the deadline only for remote phones while clocks run', () => {
    const hostSeats = ['host', 'g1', 'g2'];
    expect(needsDeadlineCheck('p', hostSeats, true)).toBe(true);
    expect(needsDeadlineCheck('g1', hostSeats, true)).toBe(false);
    expect(needsDeadlineCheck('p', hostSeats, false)).toBe(false);
  });

  it('lists every seat this phone played on the reveal, own seat first', () => {
    const answers = [{ playerId: 'g1', correct: true, answer: true }, { playerId: 'host', correct: false, answer: null }, { playerId: 'p', correct: true, answer: false }];
    const rows = localSeatResults(['host', 'g1', 'g2', 'gone'], players, answers);
    expect(rows.map(r => r.player.id)).toEqual(['host', 'g1', 'g2']);
    expect(rows[0]).toMatchObject({ answered: false, correct: false });
    expect(rows[1]).toMatchObject({ answered: true, correct: true, answer: true });
    expect(rows[2]).toMatchObject({ answered: false, answer: null });
  });

  it('gives the TV who answered with full identity, never the answer', () => {
    const tv = tvAnswered(players, [{ playerId: 'p', correct: true, answer: 2 }]);
    expect(tv).toEqual([{ id: 'p', name: 'P', avatar: '🦊', color: '#123456' }]);
  });

  it('keeps the party colour online and the game palette offline', () => {
    expect(seatColor('#ff00aa', 0, ['#111111', '#222222'], true)).toBe('#ff00aa');
    expect(seatColor('#ff00aa', 1, ['#111111', '#222222'], false)).toBe('#222222');
    expect(seatColor(undefined, 2, ['#111111', '#222222'], true)).toBe('#111111');
  });

  it('holds the clock only while the phone travels for a seat of this device', () => {
    const deviceSeats = ['host', 'g1', 'g2'];
    expect(clockHeldForTurn(true, 'g1', deviceSeats)).toBe(true); // passing to the guest
    expect(clockHeldForTurn(true, 'host', deviceSeats)).toBe(true); // coming back for the host's own turn
    expect(clockHeldForTurn(true, 'p', deviceSeats)).toBe(false); // remote phone's turn keeps running
    expect(clockHeldForTurn(false, 'g1', deviceSeats)).toBe(false);
    expect(clockHeldForTurn(true, null, deviceSeats)).toBe(false);
  });
});
