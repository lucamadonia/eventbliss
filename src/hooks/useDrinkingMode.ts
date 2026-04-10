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

/**
 * Staggered disclaimer messages — multi-language.
 *
 * IMPORTANT: The counter is GLOBAL (not per-player). In a group of
 * 8 players, drinks are distributed — so if the counter hits 10,
 * each person only had ~1-2 drinks on average. Thresholds are set
 * accordingly high to account for group distribution:
 *
 *   10 total ≈ 1-2 per person (8 players) → gentle reminder
 *   20 total ≈ 2-3 per person → stay hydrated
 *   30 total ≈ 3-4 per person → responsibility hint
 *   50 total ≈ 6+ per person → serious reminder
 *   75 total ≈ 9+ per person → please stop
 *   100 total → legend status
 */
const DISCLAIMERS_I18N: Record<string, { at: number; message: string; emoji: string }[]> = {
  de: [
    { at: 10, message: "10 Runden getrunken! Denkt an Wasser zwischendurch.", emoji: "💧" },
    { at: 20, message: "20 Runden! Bleibt hydrated — Wasser ist euer Freund.", emoji: "😅" },
    { at: 30, message: "30 Runden! Ihr seid gut dabei. Trink verantwortungsvoll.", emoji: "🍃" },
    { at: 50, message: "50 Runden! Bitte kein Auto fahren heute Nacht.", emoji: "🚫" },
    { at: 75, message: "75?! Respekt. Aber vielleicht langsam genug?", emoji: "😵" },
    { at: 100, message: "100 RUNDEN. Ihr seid Legenden. Aber bitte auf euch aufpassen!", emoji: "❤️" },
  ],
  en: [
    { at: 10, message: "10 rounds downed! Remember to drink water too.", emoji: "💧" },
    { at: 20, message: "20 rounds! Stay hydrated — water is your friend.", emoji: "😅" },
    { at: 30, message: "30 rounds! You're going strong. Drink responsibly.", emoji: "🍃" },
    { at: 50, message: "50 rounds! Please don't drive tonight.", emoji: "🚫" },
    { at: 75, message: "75?! Respect. But maybe slow down?", emoji: "😵" },
    { at: 100, message: "100 ROUNDS. You're legends. But please take care!", emoji: "❤️" },
  ],
  es: [
    { at: 10, message: "¡10 rondas! Recuerden beber agua también.", emoji: "💧" },
    { at: 20, message: "¡20 rondas! Manténganse hidratados.", emoji: "😅" },
    { at: 30, message: "¡30 rondas! Van fuerte. Beban con responsabilidad.", emoji: "🍃" },
    { at: 50, message: "¡50 rondas! Por favor no conduzcan esta noche.", emoji: "🚫" },
    { at: 75, message: "¿¡75!? Respeto. ¿Pero quizás más despacio?", emoji: "😵" },
    { at: 100, message: "¡100 RONDAS! Son leyendas. ¡Pero cuídense!", emoji: "❤️" },
  ],
  fr: [
    { at: 10, message: "10 tours ! Pensez à boire de l'eau aussi.", emoji: "💧" },
    { at: 20, message: "20 tours ! Restez hydratés.", emoji: "😅" },
    { at: 30, message: "30 tours ! Vous assurez. Buvez responsablement.", emoji: "🍃" },
    { at: 50, message: "50 tours ! Ne conduisez pas ce soir svp.", emoji: "🚫" },
    { at: 75, message: "75 ?! Respect. Mais peut-être plus doucement ?", emoji: "😵" },
    { at: 100, message: "100 TOURS ! Vous êtes des légendes. Mais faites attention !", emoji: "❤️" },
  ],
  it: [
    { at: 10, message: "10 round! Ricordatevi di bere acqua.", emoji: "💧" },
    { at: 20, message: "20 round! Restate idratati.", emoji: "😅" },
    { at: 30, message: "30 round! State andando forte. Bevete responsabilmente.", emoji: "🍃" },
    { at: 50, message: "50 round! Per favore non guidate stasera.", emoji: "🚫" },
    { at: 75, message: "75?! Rispetto. Ma forse rallentate?", emoji: "😵" },
    { at: 100, message: "100 ROUND! Siete leggende. Ma fate attenzione!", emoji: "❤️" },
  ],
  nl: [
    { at: 10, message: "10 rondes! Vergeet niet water te drinken.", emoji: "💧" },
    { at: 20, message: "20 rondes! Blijf gehydrateerd.", emoji: "😅" },
    { at: 30, message: "30 rondes! Jullie gaan lekker. Drink verantwoord.", emoji: "🍃" },
    { at: 50, message: "50 rondes! Rij alsjeblieft niet vanavond.", emoji: "🚫" },
    { at: 75, message: "75?! Respect. Maar misschien rustiger aan?", emoji: "😵" },
    { at: 100, message: "100 RONDES! Jullie zijn legendes. Maar pas op jezelf!", emoji: "❤️" },
  ],
  pt: [
    { at: 10, message: "10 rodadas! Lembrem-se de beber água.", emoji: "💧" },
    { at: 20, message: "20 rodadas! Mantenham-se hidratados.", emoji: "😅" },
    { at: 30, message: "30 rodadas! Estão a ir bem. Bebam com responsabilidade.", emoji: "🍃" },
    { at: 50, message: "50 rodadas! Por favor não conduzam esta noite.", emoji: "🚫" },
    { at: 75, message: "75?! Respeito. Mas talvez mais devagar?", emoji: "😵" },
    { at: 100, message: "100 RODADAS! São lendas. Mas cuidem-se!", emoji: "❤️" },
  ],
  pl: [
    { at: 10, message: "10 rund! Pamiętajcie o piciu wody.", emoji: "💧" },
    { at: 20, message: "20 rund! Nawadniajcie się.", emoji: "😅" },
    { at: 30, message: "30 rund! Idzie wam dobrze. Pijcie odpowiedzialnie.", emoji: "🍃" },
    { at: 50, message: "50 rund! Proszę nie prowadźcie dziś auta.", emoji: "🚫" },
    { at: 75, message: "75?! Szacunek. Ale może trochę wolniej?", emoji: "😵" },
    { at: 100, message: "100 RUND! Jesteście legendami. Ale uważajcie na siebie!", emoji: "❤️" },
  ],
  tr: [
    { at: 10, message: "10 tur! Su içmeyi unutmayın.", emoji: "💧" },
    { at: 20, message: "20 tur! Hidrate kalın.", emoji: "😅" },
    { at: 30, message: "30 tur! İyi gidiyorsunuz. Sorumlu için.", emoji: "🍃" },
    { at: 50, message: "50 tur! Lütfen bu gece araba kullanmayın.", emoji: "🚫" },
    { at: 75, message: "75?! Saygılar. Ama belki biraz yavaşlayın?", emoji: "😵" },
    { at: 100, message: "100 TUR! Efsanesiniz. Ama kendinize dikkat edin!", emoji: "❤️" },
  ],
  ar: [
    { at: 10, message: "١٠ جولات! لا تنسوا شرب الماء.", emoji: "💧" },
    { at: 20, message: "٢٠ جولة! حافظوا على الترطيب.", emoji: "😅" },
    { at: 30, message: "٣٠ جولة! أنتم رائعون. اشربوا بمسؤولية.", emoji: "🍃" },
    { at: 50, message: "٥٠ جولة! من فضلكم لا تقودوا الليلة.", emoji: "🚫" },
    { at: 75, message: "٧٥؟! احترام. لكن ربما أبطأ قليلاً؟", emoji: "😵" },
    { at: 100, message: "١٠٠ جولة! أنتم أساطير. لكن اعتنوا بأنفسكم!", emoji: "❤️" },
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
