import { afterEach, describe, expect, it, vi } from 'vitest';
import { PausableTasks } from './pausable-tasks';

afterEach(() => { vi.useRealTimers(); });
describe('room pause preserves scheduled gameplay', () => {
  it('keeps the current word and its remaining answer window through a long disconnect', () => {
    vi.useFakeTimers();
    const tasks = new PausableTasks(); const expire = vi.fn();
    tasks.setTimeout(expire, 1000);
    vi.advanceTimersByTime(400); tasks.setEnabled(false);
    vi.advanceTimersByTime(60000); expect(expire).not.toHaveBeenCalled();
    tasks.setEnabled(true);
    vi.advanceTimersByTime(599); expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(expire).toHaveBeenCalledOnce();
  });
  it('supports repeated pauses and delays queued while already paused', () => {
    vi.useFakeTimers();
    const tasks = new PausableTasks(false); const next = vi.fn();
    tasks.setTimeout(next, 3200);
    vi.advanceTimersByTime(5000); tasks.setEnabled(true);
    vi.advanceTimersByTime(1000); tasks.setEnabled(false);
    vi.advanceTimersByTime(8000); tasks.setEnabled(true);
    vi.advanceTimersByTime(2199); expect(next).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(next).toHaveBeenCalledOnce();
  });
  it('cancels pending rounds on unmount and permits nested scheduled transitions', () => {
    vi.useFakeTimers();
    const tasks = new PausableTasks(); const next = vi.fn();
    tasks.setTimeout(() => tasks.setTimeout(next, 600), 3200);
    vi.advanceTimersByTime(3200);
    tasks.clear(); vi.advanceTimersByTime(10000);
    expect(next).not.toHaveBeenCalled();
  });
});
