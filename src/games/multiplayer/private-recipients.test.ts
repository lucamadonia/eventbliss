import { describe, expect, it } from 'vitest';
import { privateRecipients } from './private-recipients';

describe('private snapshots only go to seats with their own device', () => {
  const players = [
    { id: 'host' }, { id: 'lena' }, { id: 'max', controlledBy: 'host' }, { id: 'gerda', controlledBy: 'host' }, { id: 'tom' },
  ];
  it('never targets a 🔁 guest seat or the sending device', () => {
    const ids = privateRecipients(players, 'host').map(p => p.id);
    expect(ids).toEqual(['lena', 'tom']);
    expect(ids.some(id => players.find(p => p.id === id)?.controlledBy)).toBe(false);
  });
  it('is unchanged for phone-only rooms', () => {
    expect(privateRecipients([{ id: 'host' }, { id: 'a' }, { id: 'b' }], 'host').map(p => p.id)).toEqual(['a', 'b']);
  });
});
