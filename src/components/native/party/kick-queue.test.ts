import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelKick, flushKick, getPendingKick, scheduleKick } from './kick-queue';

describe('kick-queue', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { cancelKick(); vi.useRealTimers(); });

  it('sends only after the grace period', () => {
    const run = vi.fn();
    scheduleKick('tom', 'Tom', run, 5000);
    expect(getPendingKick()?.id).toBe('tom');
    vi.advanceTimersByTime(4999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledOnce();
    expect(getPendingKick()).toBeNull();
  });

  it('undo never sends', () => {
    const run = vi.fn();
    scheduleKick('tom', 'Tom', run);
    expect(cancelKick()).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(run).not.toHaveBeenCalled();
    expect(cancelKick()).toBe(false);
  });

  it('a second kick sends the first immediately', () => {
    const first = vi.fn(), second = vi.fn();
    scheduleKick('tom', 'Tom', first);
    scheduleKick('lea', 'Lea', second);
    expect(first).toHaveBeenCalledOnce();
    expect(getPendingKick()?.id).toBe('lea');
    flushKick();
    expect(second).toHaveBeenCalledOnce();
  });

  it('swallows rejected sends', async () => {
    scheduleKick('tom', 'Tom', () => Promise.reject(new Error('x')));
    expect(() => flushKick()).not.toThrow();
  });
});
