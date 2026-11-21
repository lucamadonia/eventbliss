import { describe, expect, it } from 'vitest';
import {
  activityCategory, computeDuration, dayAfter, daysBetween, formatMoney, hhmm, isFarFromEvent, isoDay,
  overlappingIds, parseCost,
} from '../../src/lib/schedule-utils';

const slot = (id: string, dayDate: string, startTime: string | null, endTime: string | null) => ({ id, dayDate, startTime, endTime });

describe('schedule days', () => {
  it('keeps the local calendar day late in the evening and early in the morning', () => {
    expect(isoDay(new Date(2026, 10, 21, 23, 59))).toBe('2026-11-21');
    expect(isoDay(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
  it('steps over month, year and leap-day borders', () => {
    expect(dayAfter('2026-11-30')).toBe('2026-12-01');
    expect(dayAfter('2026-12-31')).toBe('2027-01-01');
    expect(dayAfter('2028-02-28')).toBe('2028-02-29');
  });
  it('counts whole days across a daylight-saving change', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-26', '2026-10-24')).toBe(-2);
  });
  it('warns only about dates far from the event', () => {
    expect(isFarFromEvent('2026-06-12', '2026-06-13')).toBe(false); // arrival the day before
    expect(isFarFromEvent('2026-06-20', '2026-06-13')).toBe(false); // a full week
    expect(isFarFromEvent('2026-07-13', '2026-06-13')).toBe(true);  // wrong month picked
    expect(isFarFromEvent('2026-07-13', null)).toBe(false);         // no event date: nothing to compare
  });
});

describe('schedule times', () => {
  it('reads database times as HH:MM', () => {
    expect(hhmm('14:30:00')).toBe('14:30');
    expect(hhmm(null)).toBeNull();
  });
  it('describes a span and stays silent without one', () => {
    expect(computeDuration('10:00', '12:00')).toBe('2h');
    expect(computeDuration('10:00', '11:30')).toBe('1.5h');
    expect(computeDuration('10:00', '10:45')).toBe('45min');
    expect(computeDuration('10:00', '10:00')).toBe('');
    expect(computeDuration('10:00', null)).toBe('');
  });
  it('flags only real collisions on the same day', () => {
    const ids = overlappingIds([
      slot('dinner', '2026-06-13', '19:00', '21:00'),
      slot('bar', '2026-06-13', '20:30', '23:00'),
      slot('brunch', '2026-06-14', '19:30', '20:30'),   // other day
      slot('taxi', '2026-06-13', '21:00', '21:30'),     // back-to-back with dinner, inside bar
      slot('toast', '2026-06-13', '20:00', null),       // a moment, not a range
    ]);
    expect([...ids].sort()).toEqual(['bar', 'dinner', 'taxi']);
  });
  it('does not flag back-to-back slots', () => {
    expect(overlappingIds([slot('a', '2026-06-13', '10:00', '11:00'), slot('b', '2026-06-13', '11:00', '12:00')]).size).toBe(0);
  });
});

describe('schedule money and categories', () => {
  it('accepts comma and dot, rounds to cents, treats empty as no cost', () => {
    expect(parseCost('12,50')).toBe(12.5);
    expect(parseCost(' 12.506 ')).toBe(12.51);
    expect(parseCost('0')).toBe(0);
    expect(parseCost('   ')).toBeNull();
  });
  it.each(['abc', '-5', '1e3', '12,5,0', '1 000', '999999999'])('rejects %j', text => {
    expect(parseCost(text)).toBe('invalid');
  });
  it('formats in the app language and survives an unknown currency', () => {
    expect(formatMoney(12.5, 'EUR', 'en')).toContain('12.50');
    expect(formatMoney(12.5, 'EUR', 'de')).toContain('12,50');
    expect(formatMoney(5, 'not-a-currency', 'en')).toBe('5 not-a-currency');
  });
  it('maps unknown categories to "other"', () => {
    expect(activityCategory('party')).toBe('party');
    expect(activityCategory('karaoke')).toBe('other');
    expect(activityCategory(null)).toBe('other');
  });
});
