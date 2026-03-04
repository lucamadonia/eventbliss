import { App } from '@capacitor/app';
import { isNative } from './platform';

export function initDeepLinks(navigate: (path: string) => void): void {
  if (!isNative()) return;

  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;
      if (path) {
        navigate(path);
      }
    } catch (e) {
      console.warn('Deep link parse error:', e);
    }
  });
}
