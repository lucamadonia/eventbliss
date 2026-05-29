/**
 * Storage adapter for Supabase auth tokens that uses Capacitor Preferences
 * on native platforms (iOS Keychain / Android EncryptedSharedPreferences when
 * available) and falls back to `localStorage` in the browser.
 *
 * Capacitor Preferences is NOT a hardware-keystore-backed secure storage by
 * default, but it is sandboxed per app and encrypted at rest on iOS via the
 * Data Protection API and on Android via app-private files. This is a
 * meaningful improvement over plain localStorage inside the WebView for
 * GDPR Art. 32 hardening.
 *
 * If the @capacitor/preferences plugin is not installed at build time,
 * the adapter transparently keeps using localStorage. No runtime crashes.
 */

import { Capacitor } from "@capacitor/core";

interface SupabaseStorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

const KEY_PREFIX = "sb_auth__";

let nativeImplPromise: Promise<SupabaseStorageAdapter | null> | null = null;

function resolveNativeImpl(): Promise<SupabaseStorageAdapter | null> {
  if (nativeImplPromise) return nativeImplPromise;
  nativeImplPromise = (async () => {
    try {
      // The package may not be installed in every environment (web-only dev
      // setups skip it). We hide the specifier from Vite's static analyzer by
      // assembling it at runtime, and we add /* @vite-ignore */ so Vite does
      // not attempt to pre-bundle it. When the package is missing, the
      // dynamic import throws and we transparently fall back to localStorage.
      const pkg = "@capacitor" + "/preferences";
      const mod: { Preferences?: {
        get: (opts: { key: string }) => Promise<{ value: string | null }>;
        set: (opts: { key: string; value: string }) => Promise<void>;
        remove: (opts: { key: string }) => Promise<void>;
      } } | null = await import(/* @vite-ignore */ pkg).catch(() => null);
      if (!mod || !mod.Preferences) return null;
      const { Preferences } = mod;
      return {
        async getItem(key) {
          const { value } = await Preferences.get({ key: KEY_PREFIX + key });
          return value ?? null;
        },
        async setItem(key, value) {
          await Preferences.set({ key: KEY_PREFIX + key, value });
        },
        async removeItem(key) {
          await Preferences.remove({ key: KEY_PREFIX + key });
        },
      } satisfies SupabaseStorageAdapter;
    } catch {
      return null;
    }
  })();
  return nativeImplPromise;
}

/**
 * Returns the appropriate storage backend for the current environment.
 * On the web → returns the synchronous `localStorage` (Supabase accepts it).
 * On native → returns an async adapter backed by Capacitor Preferences.
 */
export function getAuthStorage(): SupabaseStorageAdapter {
  const isNative = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform?.();

  if (!isNative) {
    // localStorage matches the SupabaseStorageAdapter interface.
    return localStorage as unknown as SupabaseStorageAdapter;
  }

  // On native we expose an async wrapper that lazily resolves the plugin.
  return {
    async getItem(key) {
      const impl = await resolveNativeImpl();
      if (!impl) return localStorage.getItem(key);
      return impl.getItem(key);
    },
    async setItem(key, value) {
      const impl = await resolveNativeImpl();
      if (!impl) {
        localStorage.setItem(key, value);
        return;
      }
      await impl.setItem(key, value);
    },
    async removeItem(key) {
      const impl = await resolveNativeImpl();
      if (!impl) {
        localStorage.removeItem(key);
        return;
      }
      await impl.removeItem(key);
    },
  } satisfies SupabaseStorageAdapter;
}
