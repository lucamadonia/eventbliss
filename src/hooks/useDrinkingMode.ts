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
const DRINKS_KEY = "eventbliss.drinkCount";
const SESSION_KEY = "eventbliss.drinkSession";

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

/** Staggered disclaimer messages based on drink count — multi-language */
const DISCLAIMERS_I18N: Record<string, { at: number; message: string; emoji: string }[]> = {
  de: [
    { at: 3,  message: "Denk dran: Wasser zwischendurch!", emoji: "💧" },
    { at: 5,  message: "5 Drinks! Vielleicht eine Pause?", emoji: "😅" },
    { at: 8,  message: "Du bist gut dabei! Trink verantwortungsvoll.", emoji: "🍃" },
    { at: 10, message: "10 Drinks! Bitte kein Auto fahren.", emoji: "🚫" },
    { at: 15, message: "15?! Respekt. Aber vielleicht genug für heute?", emoji: "😵" },
    { at: 20, message: "OK Champion, ab jetzt nur noch Wasser!", emoji: "🏆" },
    { at: 30, message: "Du hast offiziell gewonnen. Bitte aufhören.", emoji: "🏅" },
    { at: 50, message: "LEGENDE. Aber ernsthaft: Bitte auf dich aufpassen!", emoji: "❤️" },
  ],
  en: [
    { at: 3,  message: "Remember: have some water in between!", emoji: "💧" },
    { at: 5,  message: "5 drinks! Maybe take a break?", emoji: "😅" },
    { at: 8,  message: "You're going strong! Drink responsibly.", emoji: "🍃" },
    { at: 10, message: "10 drinks! Please don't drive.", emoji: "🚫" },
    { at: 15, message: "15?! Respect. But maybe enough for today?", emoji: "😵" },
    { at: 20, message: "OK champion, water only from here!", emoji: "🏆" },
    { at: 30, message: "You've officially won. Please stop now.", emoji: "🏅" },
    { at: 50, message: "LEGEND. But seriously: take care of yourself!", emoji: "❤️" },
  ],
  es: [
    { at: 3,  message: "¡Recuerda: agua entre medias!", emoji: "💧" },
    { at: 5,  message: "¡5 tragos! ¿Quizás un descanso?", emoji: "😅" },
    { at: 8,  message: "¡Vas bien! Bebe con responsabilidad.", emoji: "🍃" },
    { at: 10, message: "¡10 tragos! Por favor no conduzcas.", emoji: "🚫" },
    { at: 15, message: "¿¡15!? Respeto. ¿Pero quizás suficiente?", emoji: "😵" },
    { at: 20, message: "OK campeón, ¡solo agua a partir de ahora!", emoji: "🏆" },
    { at: 30, message: "Has ganado oficialmente. Para ya.", emoji: "🏅" },
    { at: 50, message: "LEYENDA. Pero en serio: ¡cuídate!", emoji: "❤️" },
  ],
  fr: [
    { at: 3,  message: "N'oublie pas : de l'eau entre deux !", emoji: "💧" },
    { at: 5,  message: "5 verres ! Peut-être une pause ?", emoji: "😅" },
    { at: 8,  message: "Tu assures ! Bois de manière responsable.", emoji: "🍃" },
    { at: 10, message: "10 verres ! Ne conduis pas s'il te plaît.", emoji: "🚫" },
    { at: 15, message: "15 ?! Respect. Mais peut-être assez ?", emoji: "😵" },
    { at: 20, message: "OK champion, que de l'eau maintenant !", emoji: "🏆" },
    { at: 30, message: "Tu as officiellement gagné. Arrête.", emoji: "🏅" },
    { at: 50, message: "LÉGENDE. Mais sérieusement : fais attention !", emoji: "❤️" },
  ],
};

function getDisclaimers(): { at: number; message: string; emoji: string }[] {
  try {
    const lang = document.documentElement.lang || "de";
    const base = lang.split("-")[0].toLowerCase();
    return DISCLAIMERS_I18N[base] || DISCLAIMERS_I18N.en || DISCLAIMERS_I18N.de;
  } catch {
    return DISCLAIMERS_I18N.de;
  }
}

export interface DrinkingModeAPI {
  /** Whether the Easter Egg has been discovered */
  isActivated: boolean;
  /** Whether drinking mode is currently ON */
  isDrinkingMode: boolean;
  /** Unlock the Easter Egg (first discovery) */
  activate: () => void;
  /** Toggle drinking mode on/off */
  toggle: () => void;
  /** Record a drink — returns disclaimer message if threshold hit, else null */
  recordDrink: () => { message: string; emoji: string } | null;
  /** Current drink count for this session */
  drinkCount: number;
  /** Reset session drink count */
  resetSession: () => void;
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

  const recordDrink = useCallback((): { message: string; emoji: string } | null => {
    try {
      const current = parseInt(localStorage.getItem(DRINKS_KEY) || "0", 10);
      const next = current + 1;
      localStorage.setItem(DRINKS_KEY, String(next));
      // Store session start time if first drink
      if (!localStorage.getItem(SESSION_KEY)) {
        localStorage.setItem(SESSION_KEY, new Date().toISOString());
      }
    } catch { /* silent */ }
    emitChange();
    const count = parseInt(localStorage.getItem(DRINKS_KEY) || "0", 10);
    const disclaimer = getDisclaimers().find((d) => d.at === count);
    return disclaimer ? { message: disclaimer.message, emoji: disclaimer.emoji } : null;
  }, []);

  const resetSession = useCallback(() => {
    try {
      localStorage.removeItem(DRINKS_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch { /* silent */ }
    emitChange();
  }, []);

  const drinkCount = (() => {
    try { return parseInt(localStorage.getItem(DRINKS_KEY) || "0", 10); }
    catch { return 0; }
  })();

  return {
    isActivated: state.activated,
    isDrinkingMode: state.enabled,
    activate,
    toggle,
    recordDrink,
    drinkCount,
    resetSession,
  };
}
