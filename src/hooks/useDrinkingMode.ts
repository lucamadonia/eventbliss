/**
 * useDrinkingMode — Easter Egg "Party-Modus 18+"
 *
 * Stores activation state in localStorage under 'eventbliss.drinkingMode'.
 * The mode is opt-in only: users must discover and activate it first,
 * then explicitly toggle it on.
 *
 * - `isActivated`: Whether the user has discovered the Easter Egg
 * - `isDrinkingMode`: Whether drinking mode is currently enabled
 * - `activate()`: Unlock the Easter Egg (first-time discovery)
 * - `toggle()`: Toggle drinking mode on/off (only works if activated)
 */
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "eventbliss.drinkingMode";
const ACTIVATED_KEY = "eventbliss.drinkingMode.activated";

// ---------------------------------------------------------------------------
// Shared state so all hook consumers stay in sync
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedSnapshot = { activated: false, enabled: false };

function readFromStorage(): { activated: boolean; enabled: boolean } {
  try {
    return {
      activated: localStorage.getItem(ACTIVATED_KEY) === "true",
      enabled: localStorage.getItem(STORAGE_KEY) === "true",
    };
  } catch {
    return { activated: false, enabled: false };
  }
}

// Initialize cache
cachedSnapshot = readFromStorage();

function emitChange() {
  cachedSnapshot = readFromStorage();
  listeners.forEach((l) => l());
}

function getSnapshot(): { activated: boolean; enabled: boolean } {
  return cachedSnapshot;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface DrinkingModeAPI {
  /** Whether the Easter Egg has been discovered */
  isActivated: boolean;
  /** Whether drinking mode is currently ON */
  isDrinkingMode: boolean;
  /** Unlock the Easter Egg (first discovery) */
  activate: () => void;
  /** Toggle drinking mode on/off */
  toggle: () => void;
}

export function useDrinkingMode(): DrinkingModeAPI {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const activate = useCallback(() => {
    try {
      localStorage.setItem(ACTIVATED_KEY, "true");
      localStorage.setItem(STORAGE_KEY, "true");
    } catch { /* quota exceeded — silent */ }
    emitChange();
  }, []);

  const toggle = useCallback(() => {
    try {
      const current = localStorage.getItem(STORAGE_KEY) === "true";
      localStorage.setItem(STORAGE_KEY, current ? "false" : "true");
    } catch { /* silent */ }
    emitChange();
  }, []);

  return {
    isActivated: state.activated,
    isDrinkingMode: state.enabled,
    activate,
    toggle,
  };
}
