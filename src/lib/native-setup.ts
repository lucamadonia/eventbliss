import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { isNative, isIOS } from './platform';

export async function initNativeSetup(): Promise<void> {
  if (!isNative()) return;

  // Mark the document so CSS can gate native-only styles
  document.documentElement.classList.add('capacitor-native');

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1a1625' });
    // Edge-to-edge on both platforms — WebView draws under status bar
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (e) {
    console.warn('StatusBar setup failed:', e);
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    await Keyboard.setScroll({ isDisabled: false });
  } catch (e) {
    console.warn('Keyboard setup failed:', e);
  }

  // Keyboard events → dispatch custom events for shell components to react
  Keyboard.addListener('keyboardWillShow', (info) => {
    window.dispatchEvent(
      new CustomEvent('capacitor:keyboard', { detail: { visible: true, height: info.keyboardHeight } })
    );
  });
  Keyboard.addListener('keyboardWillHide', () => {
    window.dispatchEvent(
      new CustomEvent('capacitor:keyboard', { detail: { visible: false, height: 0 } })
    );
  });

  App.addListener('backButton', ({ canGoBack }) => {
    // If a modal/sheet is open, let it handle back first
    const modalStack = (window as unknown as { __modalStack?: (() => boolean)[] }).__modalStack;
    if (modalStack && modalStack.length > 0) {
      const lastClose = modalStack[modalStack.length - 1];
      if (lastClose()) return;
    }

    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}
