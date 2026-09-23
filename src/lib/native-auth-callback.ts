import { getSafeAuthRedirect } from './auth-redirect';

export interface NativeAuthCallback { code: string; recovery: boolean; redirect: string; failed: boolean }
const redirectKey = 'eventbliss_native_auth_return';

export function rememberNativeAuthReturn(search: string): void {
  try {
    localStorage.setItem(redirectKey, JSON.stringify({ path: getSafeAuthRedirect(new URLSearchParams(search).get('redirect')), savedAt: Date.now() }));
  } catch { /* Optional return destination; authentication still works. */ }
}
function savedReturn(): string {
  try {
    const value = JSON.parse(localStorage.getItem(redirectKey) ?? 'null');
    return value && typeof value.savedAt === 'number' && Date.now() - value.savedAt < 86400000 ? getSafeAuthRedirect(value.path) : '/';
  } catch { return '/'; }
}
export function parseNativeAuthCallback(url: string): NativeAuthCallback | null {
  try {
    const parsed = new URL(url);
    if (!['app.eventbliss:', 'eventbliss:'].includes(parsed.protocol) && !(parsed.protocol === 'https:' && ['event-bliss.com', 'www.event-bliss.com'].includes(parsed.hostname))) return null;
    const custom = parsed.protocol !== 'https:';
    const path = custom && parsed.hostname ? `/${parsed.hostname}${parsed.pathname}` : parsed.pathname;
    if (!['/', '/auth', '/auth/callback'].includes(path)) return null;
    const code = parsed.searchParams.get('code') ?? '';
    const failed = parsed.searchParams.has('error') || parsed.searchParams.has('error_code');
    if (!code && !failed) return null;
    return { code, failed, recovery: parsed.searchParams.get('type') === 'recovery', redirect: parsed.searchParams.has('redirect') ? getSafeAuthRedirect(parsed.searchParams.get('redirect')) : savedReturn() };
  } catch { return null; }
}

type Exchange = (code: string) => Promise<{ error: unknown }>;
const exchanges = new Map<string, Promise<string>>();
/** Tokens/codes never enter app navigation or logs; repeated OS callbacks share one exchange. */
export function completeNativeAuthCallback(callback: NativeAuthCallback, exchange: Exchange): Promise<string> {
  if (callback.failed) return Promise.resolve('/auth?callback_error=1');
  const pending = exchanges.get(callback.code);
  if (pending) return pending;
  const task = (async () => {
    try {
      const { error } = await exchange(callback.code);
      if (error) return '/auth?callback_error=1';
      try {
        localStorage.removeItem(redirectKey);
        if (callback.recovery) sessionStorage.setItem('password_recovery', 'true');
      } catch { /* URL retains recovery intent when storage is unavailable. */ }
      return callback.recovery ? `/auth?type=recovery&redirect=${encodeURIComponent(callback.redirect)}` : callback.redirect;
    } catch { return '/auth?callback_error=1'; }
  })();
  exchanges.set(callback.code, task);
  void task.then(target => { if (target.includes('callback_error=1') && exchanges.get(callback.code) === task) exchanges.delete(callback.code); });
  if (exchanges.size > 10) exchanges.delete(exchanges.keys().next().value!);
  return task;
}
