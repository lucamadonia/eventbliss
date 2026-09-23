import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { completeNativeAuthCallback, parseNativeAuthCallback, rememberNativeAuthReturn } from '@/lib/native-auth-callback';
import { deepLinkTarget } from '@/lib/deep-links';

beforeEach(() => {
  for (const name of ['localStorage', 'sessionStorage']) {
    const values = new Map<string, string>();
    vi.stubGlobal(name, { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  }
});
afterEach(() => vi.unstubAllGlobals());

describe('native email confirmation and recovery', () => {
  it('restores a safe invitation from the existing triple-slash signup callback', async () => {
    rememberNativeAuthReturn('?redirect=%2Fparty%2Fjoin%2FABCDEF');
    const callback = parseNativeAuthCallback('app.eventbliss:///?code=signup-test')!;
    const exchange = vi.fn().mockResolvedValue({ error: null });
    expect(callback.redirect).toBe('/party/join/ABCDEF');
    expect(await completeNativeAuthCallback(callback, exchange)).toBe('/party/join/ABCDEF');
    expect(exchange).toHaveBeenCalledWith('signup-test');
    expect(localStorage.getItem('eventbliss_native_auth_return')).toBeNull();
  });
  it('deduplicates cold/warm callbacks and keeps recovery intent out of ordinary login', async () => {
    const callback = parseNativeAuthCallback('app.eventbliss:///auth?type=recovery&code=recovery-test')!;
    const exchange = vi.fn().mockResolvedValue({ error: null });
    const results = await Promise.all([completeNativeAuthCallback(callback, exchange), completeNativeAuthCallback(callback, exchange)]);
    expect(exchange).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['/auth?type=recovery&redirect=%2F', '/auth?type=recovery&redirect=%2F']);
    expect(sessionStorage.getItem('password_recovery')).toBe('true');
  });
  it('allows a retry after a transient exchange failure without routing secrets', async () => {
    const callback = parseNativeAuthCallback('eventbliss://auth/callback?code=retry-test')!;
    const exchange = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ error: null });
    expect(await completeNativeAuthCallback(callback, exchange)).toBe('/auth?callback_error=1');
    expect(await completeNativeAuthCallback(callback, exchange)).toBe('/');
    expect(exchange).toHaveBeenCalledTimes(2);
    expect(deepLinkTarget('app.eventbliss:///auth?type=recovery&code=secret&token=secret')).toBe('/auth?type=recovery');
  });
  it('rejects foreign origins, non-auth routes and unsafe return destinations', () => {
    expect(parseNativeAuthCallback('https://attacker.example/auth?code=bad')).toBeNull();
    expect(parseNativeAuthCallback('eventbliss://party/join/ABCDEF?code=bad')).toBeNull();
    expect(parseNativeAuthCallback('app.eventbliss:///auth?code=safe&redirect=https%3A%2F%2Fattacker.example')?.redirect).toBe('/');
    expect(parseNativeAuthCallback('app.eventbliss:///auth?error=access_denied')?.failed).toBe(true);
  });
});
