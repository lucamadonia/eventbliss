import { describe, expect, it } from 'vitest';
import { scannedInvitation } from './qr-invitation';

describe('scannedInvitation', () => {
  it('opens party, TV activation and online room QR codes in the app', () => {
    expect(scannedInvitation('https://event-bliss.com/party/join/K7QM4X')).toEqual({ kind: 'route', path: '/party/join/K7QM4X' });
    expect(scannedInvitation('https://event-bliss.com/party/controllers?source=tv&tv=ABC234')).toEqual({ kind: 'route', path: '/party/controllers?source=tv&tv=ABC234' });
    expect(scannedInvitation('https://event-bliss.com/games?room=K7QM4X')).toEqual({ kind: 'route', path: '/games/bomb?room=K7QM4X' });
  });
  it('offers a choice for plain codes and ignores foreign links', () => {
    expect(scannedInvitation('k7qm4x')).toEqual({ kind: 'code', code: 'K7QM4X' });
    expect(scannedInvitation('https://other.example/party/join/K7QM4X')).toBeNull();
    expect(scannedInvitation('javascript:alert(1)')).toBeNull();
  });
});
