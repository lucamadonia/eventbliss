import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const isIOS = (): boolean => Capacitor.getPlatform() === 'ios';

export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';

export const isWeb = (): boolean => !isNative();

/**
 * Returns the public-facing base URL for share/invite links.
 *
 * On web: uses window.location.origin (works for localhost + production).
 * On native: always returns the production URL since the WebView's origin
 * is `capacitor://localhost` which is useless for share links.
 */
export const PRODUCTION_URL = 'https://event-bliss.com';

export function getBaseUrl(): string {
  if (isNative()) return PRODUCTION_URL;
  return window.location.origin;
}
