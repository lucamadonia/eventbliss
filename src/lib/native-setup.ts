import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { isNative, isIOS } from './platform';

export async function initNativeSetup(): Promise<void> {
  if (!isNative()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1a1625' });

    if (isIOS()) {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }
  } catch (e) {
    console.warn('StatusBar setup failed:', e);
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}
