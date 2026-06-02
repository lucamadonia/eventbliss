import { App } from '@capacitor/app';
import { isNative } from './platform';

export function initDeepLinks(navigate: (path: string) => void): void {
  if (!isNative()) return;

  App.addListener('appUrlOpen', ({ url }) => {
    try {
      // Spotify-Auth-Rücksprung NICHT als Navigation behandeln: das native
      // OhrwurmSpotify-Plugin verarbeitet den Token; die App soll im Spiel
      // bleiben (sonst springt sie aufs Dashboard und die Bridge verbindet nie).
      if (url.includes('spotify-callback')) return;
      const parsed = new URL(url);
      const path = parsed.pathname;
      if (path && path !== '/') {
        navigate(path);
      }
    } catch (e) {
      console.warn('Deep link parse error:', e);
    }
  });
}
