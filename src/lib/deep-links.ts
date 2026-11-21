import { App } from '@capacitor/app';
import { isNative } from './platform';
import { completeNativeAuthCallback, parseNativeAuthCallback } from './native-auth-callback';

export function deepLinkTarget(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'spotify-callback' || parsed.pathname.includes('spotify-callback')) return null;
    if (!['eventbliss:', 'app.eventbliss:'].includes(parsed.protocol) && !(parsed.protocol === 'https:' && ['event-bliss.com', 'www.event-bliss.com'].includes(parsed.hostname))) return null;
    const path = parsed.protocol !== 'https:' && parsed.hostname ? `/${parsed.hostname}${parsed.pathname}` : parsed.pathname;
    if (!path || path === '/' || path.startsWith('//')) return null;
    // Legacy invitations without a game must reach the native game stack.
    const target = path === '/games' && parsed.searchParams.has('room') ? '/games/bomb' : path;
    const query = new URLSearchParams();
    const keys = ['room', 'name', 'lang', 'party', 'type', 'redirect', 'source', 'tv', ...(/^\/auth(?:\/|$)/.test(target) ? [] : ['code', 'token'])];
    for (const key of keys) {
      const value = parsed.searchParams.get(key);
      if (value !== null) query.set(key, value);
    }
    return target + (query.size ? `?${query}` : '');
  } catch { return null; }
}

/**
 * The link that opened the app is delivered at most once per app process.
 * The OS keeps reporting it for as long as the process lives (iOS: the last
 * opened URL), so asking again after a route change threw a guest back onto
 * `/party/join/<code>` every time they entered a game or left the party.
 */
let launchUrlSettled = false;
/** Tests only: a fresh app process. */
export function resetDeepLinksForTests(): void { launchUrlSettled = false; }

export function initDeepLinks(navigate: (path: string) => void): () => void {
  if (!isNative()) return () => {};
  let disposed = false;
  let receivedWarmLink = false;
  let delivery = 0;
  const handle = (url: string) => {
    const callback = parseNativeAuthCallback(url);
    const target = deepLinkTarget(url);
    if (!callback && !target) return false;
    const current = ++delivery;
    if (callback) {
      void completeNativeAuthCallback(callback, async code => {
        const { supabase } = await import('@/integrations/supabase/client');
        return supabase.auth.exchangeCodeForSession(code);
      }).then(target => { if (!disposed && current === delivery) navigate(target); });
      return true;
    }
    if (!disposed && target) navigate(target);
    return true;
  };
  const subscription = App.addListener('appUrlOpen', ({ url }) => { if (handle(url)) { receivedWarmLink = true; launchUrlSettled = true; } });
  if (!launchUrlSettled) void App.getLaunchUrl().then(result => {
    // An unmounted handler (StrictMode remount) leaves the launch link to its successor.
    if (disposed || launchUrlSettled) return;
    launchUrlSettled = true;
    if (!receivedWarmLink && result?.url) handle(result.url);
  }).catch(() => { /* A launch without a URL must not prevent app startup. */ });
  return () => { disposed = true; void subscription.then(listener => listener.remove()).catch(() => {}); };
}
