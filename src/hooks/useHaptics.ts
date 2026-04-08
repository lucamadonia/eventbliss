/**
 * useHaptics — unified haptic feedback API.
 * Wraps @capacitor/haptics. No-op on web (graceful degradation).
 *
 * Usage:
 *   const h = useHaptics();
 *   <button onClick={() => { h.light(); doThing(); }}>...</button>
 */
import { useCallback, useMemo } from "react";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative } from "@/lib/platform";

export interface HapticsAPI {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
  select: () => void;
  /** Countdown tick (heavy impact) — use for 3, 2, 1 countdowns */
  countdown: () => void;
  /** Triple success burst — use for wins / celebrations */
  celebrate: () => void;
}

const noop = () => {};

const nativeApi: HapticsAPI = {
  light:   () => { Haptics.impact({ style: ImpactStyle.Light }).catch(noop); },
  medium:  () => { Haptics.impact({ style: ImpactStyle.Medium }).catch(noop); },
  heavy:   () => { Haptics.impact({ style: ImpactStyle.Heavy }).catch(noop); },
  success: () => { Haptics.notification({ type: NotificationType.Success }).catch(noop); },
  warning: () => { Haptics.notification({ type: NotificationType.Warning }).catch(noop); },
  error:   () => { Haptics.notification({ type: NotificationType.Error }).catch(noop); },
  select:  () => { Haptics.selectionStart().then(() => Haptics.selectionEnd()).catch(noop); },
  countdown: () => { Haptics.impact({ style: ImpactStyle.Heavy }).catch(noop); },
  celebrate: () => {
    Haptics.notification({ type: NotificationType.Success }).catch(noop);
    setTimeout(() => Haptics.notification({ type: NotificationType.Success }).catch(noop), 200);
    setTimeout(() => Haptics.notification({ type: NotificationType.Success }).catch(noop), 400);
  },
};

const webApi: HapticsAPI = {
  light: noop, medium: noop, heavy: noop,
  success: noop, warning: noop, error: noop,
  select: noop, countdown: noop, celebrate: noop,
};

export function useHaptics(): HapticsAPI {
  // isNative() is stable across renders in a Capacitor environment
  return useMemo(() => (isNative() ? nativeApi : webApi), []);
}

/** Imperative, non-hook version for one-off calls outside React components */
export const haptics: HapticsAPI = new Proxy({} as HapticsAPI, {
  get: (_, prop: keyof HapticsAPI) => (isNative() ? nativeApi[prop] : webApi[prop]),
});
