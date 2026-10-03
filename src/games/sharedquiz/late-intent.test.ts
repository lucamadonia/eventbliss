import { describe, expect, it, vi } from 'vitest';
import { LATE_NOTICE_EVENT, reportLateIntent } from './late-intent';

describe('late input after the turn moved on (F12)', () => {
  const players = [{ id: 'host' }, { id: 'tom' }];
  it('records input-rejected and sends the sender a late notice', () => {
    const push = vi.fn(), broadcastTo = vi.fn();
    const late = reportLateIntent({ players, broadcastTo }, { __senderId: 'tom', token: 'statement:2:1' }, 'statement:3:0', true, push);
    expect(late).toBe(true);
    expect(push).toHaveBeenCalledWith({ kind: 'input-rejected', reason: 'late', playerId: 'tom', sceneId: 'statement:2:1' });
    expect(broadcastTo).toHaveBeenCalledWith('tom', LATE_NOTICE_EVENT, { token: 'statement:2:1' });
  });
  it('ignores current-turn intents and strangers', () => {
    const push = vi.fn(), broadcastTo = vi.fn();
    expect(reportLateIntent({ players, broadcastTo }, { __senderId: 'tom', token: 'now' }, 'now', true, push)).toBe(false);
    expect(reportLateIntent({ players, broadcastTo }, { __senderId: 'eve', token: 'old' }, 'now', true, push)).toBe(false);
    expect(push).not.toHaveBeenCalled();
    expect(broadcastTo).not.toHaveBeenCalled();
  });
});
