// Native "Sign in with Apple" (iOS) and "Sign in with Google" (iOS + Android)
// via @capgo/capacitor-social-login. The native SDK returns an OIDC ID token
// which is exchanged for a Supabase session with signInWithIdToken — no
// browser-redirect OAuth on native.
//
// Nonce handling: the plugin passes the nonce RAW into the native request
// (ASAuthorizationAppleIDRequest.nonce on iOS, Credential Manager setNonce on
// Android), so the resulting ID token carries the value we send. Supabase
// hashes the `nonce` we give to signInWithIdToken with SHA-256 and compares it
// to the token's nonce claim — therefore we send sha256(rawNonce) to the
// native SDK and rawNonce to Supabase.
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '@/integrations/supabase/client';
import { isNative, isIOS } from './platform';

export interface NativeAuthResult {
  success: boolean;
  /** True when the user dismissed the native sheet — not an error. */
  cancelled?: boolean;
  error?: string;
}

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined;

// Resolves to true once SocialLogin.initialize() succeeded. Shared so login
// calls can await app-start initialization (same pattern as revenuecat.ts).
let initPromise: Promise<boolean> | null = null;

/** Whether Google login is configured for the current platform. */
export function isGoogleAuthAvailable(): boolean {
  if (!isNative()) return false;
  // iOS needs the iOS client id, Android the web client id.
  return isIOS() ? !!GOOGLE_IOS_CLIENT_ID : !!GOOGLE_WEB_CLIENT_ID;
}

/** Whether Apple login is available (iOS only). */
export function isAppleAuthAvailable(): boolean {
  return isNative() && isIOS();
}

/**
 * Initialize the social-login plugin. Native only — no-op on web.
 * Safe to call multiple times; only the first call initializes.
 * Missing Google env vars log a warning and disable Google login (no crash).
 */
export function initSocialLogin(): Promise<boolean> {
  if (!isNative()) return Promise.resolve(false);

  if (!initPromise) {
    initPromise = (async () => {
      const googleAvailable = isGoogleAuthAvailable();
      if (!googleAvailable) {
        console.warn(
          '[NativeAuth] Missing Google client id (VITE_GOOGLE_WEB_CLIENT_ID / VITE_GOOGLE_IOS_CLIENT_ID) — Google login disabled.'
        );
      }
      try {
        await SocialLogin.initialize({
          // Apple Sign-In on iOS uses system APIs; no client id needed.
          // (On Android, Apple would require a clientId + redirectUrl web
          // flow — we only offer Apple on iOS.)
          ...(isIOS() ? { apple: {} } : {}),
          ...(googleAvailable
            ? {
                google: {
                  webClientId: GOOGLE_WEB_CLIENT_ID,
                  iOSClientId: GOOGLE_IOS_CLIENT_ID,
                  // Same as webClientId — lets Supabase validate the token
                  // audience consistently and enables server auth codes.
                  iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
                },
              }
            : {}),
        });
        return true;
      } catch (e) {
        console.warn('[NativeAuth] SocialLogin.initialize failed:', e);
        return false;
      }
    })();
  }
  return initPromise;
}

/** Cryptographically random nonce (hex). */
function generateNonce(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hash of a string, hex-encoded. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The plugin rejects with code 'USER_CANCELLED' when the user dismisses the sheet. */
function isUserCancelled(e: unknown): boolean {
  const err = e as { code?: string; message?: string } | null;
  if (err?.code === 'USER_CANCELLED') return true;
  return /cancel/i.test(err?.message ?? '');
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Native Sign in with Apple (iOS only).
 * Apple returns name/email ONLY on the very first login; if present, the name
 * is stored on the Supabase user as `full_name` (best effort).
 */
export async function signInWithApple(): Promise<NativeAuthResult> {
  if (!isAppleAuthAvailable()) return { success: false, error: 'web' };
  if (!(await initSocialLogin())) return { success: false, error: 'init_failed' };

  try {
    const rawNonce = generateNonce();
    const hashedNonce = await sha256Hex(rawNonce);

    const { result } = await SocialLogin.login({
      provider: 'apple',
      options: { scopes: ['email', 'name'], nonce: hashedNonce },
    });

    const idToken = result.idToken;
    if (!idToken) return { success: false, error: 'no_id_token' };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
      nonce: rawNonce,
    });
    if (error) {
      console.warn('[NativeAuth] Supabase Apple sign-in failed:', error.message);
      return { success: false, error: error.message };
    }

    // Best effort: persist the name Apple only shares on first login.
    const fullName = [result.profile?.givenName, result.profile?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName) {
      try {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      } catch (e) {
        console.warn('[NativeAuth] Storing Apple full_name failed:', e);
      }
    }

    return { success: true };
  } catch (e) {
    if (isUserCancelled(e)) return { success: false, cancelled: true };
    console.warn('[NativeAuth] Apple sign-in failed:', e);
    return { success: false, error: errorMessage(e) };
  }
}

/** Native Sign in with Google (iOS + Android). */
export async function signInWithGoogle(): Promise<NativeAuthResult> {
  if (!isNative()) return { success: false, error: 'web' };
  if (!isGoogleAuthAvailable()) return { success: false, error: 'google_disabled' };
  if (!(await initSocialLogin())) return { success: false, error: 'init_failed' };

  try {
    const rawNonce = generateNonce();
    const hashedNonce = await sha256Hex(rawNonce);

    const { result } = await SocialLogin.login({
      provider: 'google',
      options: { scopes: ['email', 'profile'], nonce: hashedNonce },
    });

    const idToken = result.responseType === 'online' ? result.idToken : null;
    if (!idToken) return { success: false, error: 'no_id_token' };

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce: rawNonce,
    });
    if (error) {
      console.warn('[NativeAuth] Supabase Google sign-in failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    if (isUserCancelled(e)) return { success: false, cancelled: true };
    console.warn('[NativeAuth] Google sign-in failed:', e);
    return { success: false, error: errorMessage(e) };
  }
}
