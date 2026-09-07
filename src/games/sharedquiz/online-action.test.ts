import { describe, it, expect } from 'vitest';
import { acceptOnlineAction } from './online-action';

describe('authoritative room actions', () => {
  const packet = { __senderId: 'guest', voterId: 'host', token: 'voting:2:1', seq: 1, instance: 'tab1' };
  it('uses authenticated sender, never the claimed voter, and rejects wrong turns', () => {
    const seen = new Map<string, number>();
    expect(acceptOnlineAction(packet, packet.token, ['host', 'guest'], seen, id => id === 'host')).toBe(false);
    expect(acceptOnlineAction(packet, 'voting:3:1', ['guest'], seen, () => true)).toBe(false);
    expect(acceptOnlineAction(packet, packet.token, ['guest'], seen, id => id === 'guest')).toBe(true);
  });
  it('applies each intent once while allowing a reconnected client to restart its sequence', () => {
    const seen = new Map<string, number>();
    expect(acceptOnlineAction(packet, packet.token, ['guest'], seen, () => true)).toBe(true);
    expect(acceptOnlineAction(packet, packet.token, ['guest'], seen, () => true)).toBe(false);
    expect(acceptOnlineAction({ ...packet, instance: 'reconnected' }, packet.token, ['guest'], seen, () => true)).toBe(true);
  });
  it('rejects nonmembers and malformed sequence numbers without mutating dedup state', () => {
    const seen = new Map<string, number>();
    expect(acceptOnlineAction(packet, packet.token, [], seen, () => true)).toBe(false);
    expect(acceptOnlineAction({ ...packet, seq: NaN }, packet.token, ['guest'], seen, () => true)).toBe(false);
    expect(seen.size).toBe(0);
  });
});
