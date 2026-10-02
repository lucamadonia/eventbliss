/**
 * Party-Play Motion — die eine Quelle fuer Bewegung, Haptik und Ton im
 * Party-Abend (Fernseher, Host-Handy, Spieler-Handy).
 *
 * WARUM ZENTRAL: Drei Geraete zeigen denselben Moment. Haben sie eigene
 * Timings, wirkt der Abend zusammengestueckelt. Hier steht pro Uebergang
 * T01–T19 (docs/party-play-masterplan.md, Abschnitt 4.2), was jedes Geraet
 * tut: Animation, Dauer, Haptik, Ton (Ton nur am Fernseher).
 *
 * Grundsaetze (docs/party-play-design.md):
 *   - Eintritt ease-out, Austritt schneller als Eintritt, nie aus scale(0).
 *   - Handy-UI bleibt unter 300 ms; die grosse Buehne ist der Fernseher.
 *   - Bewegungsarmut: dasselbe Endbild, nur ohne Weg — Zeiten mit Bedeutung
 *     (Countdown, Fristen, Rueckgaengig) bleiben unveraendert.
 *
 * Reine Daten + framer-motion-Typen, kein React — direkt testbar.
 */
import type { Transition, Variants } from "framer-motion";

// ── Grundtoken ─────────────────────────────────────────────────────

/** Dauer in Millisekunden (Tabellen, Timer, Tests). */
export const partyMs = {
  press: 140, // Druck-Feedback
  micro: 200, // Haken, Zaehler, Chip
  ui: 260, // Liste, Sheet-Inhalt, Statuswechsel am Handy
  sheet: 320, // Sheet/Dialog rein; TV-Kreuzblende (T18 bestehend 0,32 s)
  card: 480, // Karte erscheint am TV
  flip: 700, // Platz-Wechsel 🔁→📱
  arrival: 1200, // Avatar fliegt am TV ein (T01)
  banner: 1500, // „Lena ist dran“ (T06/T07)
} as const;

/** Dieselben Werte in Sekunden fuer framer-motion. */
export const partyDuration = Object.fromEntries(
  Object.entries(partyMs).map(([k, v]) => [k, v / 1000]),
) as { readonly [K in keyof typeof partyMs]: number };

/** Kraeftige Kurven (Emil Kowalski); ease-in nur fuer Austritte. */
export const partyEase = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  drawer: [0.32, 0.72, 0, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

export const partySpring = {
  /** Karten, Listen — ruhig, kein Nachschwingen. */
  settle: { type: "spring", duration: 0.45, bounce: 0.12 } as Transition,
  /** Ankunft, Haken — ein Hauch Lebendigkeit. */
  pop: { type: "spring", duration: 0.5, bounce: 0.28 } as Transition,
  /** Sheets und Dialoge. */
  sheet: { type: "spring", duration: 0.42, bounce: 0.08 } as Transition,
} as const;

/** Szenen-Uhr: Vorlauf und Versatzbudget (Masterplan 4.1 / G5). */
export const SCENE_LEAD_MS = 600;
export const SCENE_SKEW_BUDGET_MS = 250;
/** Abstand zwischen gestaffelten Listeneintraegen. */
export const STAGGER_MS = 50;
/** Rueckgaengig-Fenster nach dem Entfernen (T19). */
export const UNDO_WINDOW_MS = 5000;
/** Reaktionen: max. eine pro Spieler und Sekunde (X01). */
export const REACTION_COOLDOWN_MS = 1000;

/**
 * Synchrones Konfetti (T16, T-5). Alle Geraete starten den Ausbruch zur
 * selben `startsAt` + `afterDrumrollMs`; Partikelzahl skaliert mit der Flaeche.
 */
export const confettiBurst = {
  drumrollMs: 2400,
  afterDrumrollMs: 2400,
  durationMs: 2600,
  particles: { tv: 160, host: 70, phone: 70 },
  /** Bei Bewegungsarmut: kein Fallen, nur ein kurzes Aufleuchten. */
  reducedFlashMs: 400,
} as const;

// ── Gemeinsame Varianten ───────────────────────────────────────────

const exitFast = (ms: number = partyMs.micro): Transition => ({ duration: ms / 1000, ease: partyEase.exit });

/** Karte/Listeneintrag erscheint (Handy-Liste, TV-Spielerkarte). */
export const cardEnter: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.96, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: partySpring.settle },
  exit: { opacity: 0, scale: 0.96, transition: exitFast() },
};

/** Avatar fliegt am TV aus der Tiefe ein (T01, 1,2 s inkl. Glow-Nachklang). */
export const avatarArrive: Variants = {
  initial: { opacity: 0, y: 40, scale: 0.6, filter: "blur(10px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: partyDuration.card, ease: partyEase.out },
  },
  exit: { opacity: 0, scale: 0.9, filter: "blur(6px)", transition: exitFast(partyMs.ui) },
};

/** Platz-Wechsel 🔁→📱: Symbol dreht um die Y-Achse (Eltern: perspective 800px). */
export const seatFlip: Variants = {
  initial: { rotateY: -180, opacity: 0.4 },
  animate: { rotateY: 0, opacity: 1, transition: { duration: partyDuration.flip, ease: partyEase.inOut } },
  exit: { rotateY: 180, opacity: 0, transition: exitFast(partyMs.ui) },
};

/** Profil-Aenderung: alter Inhalt verschwimmt in den neuen (T03, mit AnimatePresence mode="popLayout"). */
export const profileMorph: Variants = {
  initial: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: partyDuration.card, ease: partyEase.out } },
  exit: { opacity: 0, scale: 1.04, filter: "blur(6px)", transition: exitFast(partyMs.ui) },
};

/** Jemand geht (T19, T02 Host-Liste) — leise, ohne Drama. */
export const leaveFade: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94, filter: "saturate(0) blur(4px)", transition: { duration: 0.6, ease: partyEase.out } },
};

/** Countdown 3-2-1: jede Zahl schlaegt ein (pro Ziffer 1 s, Animation 0,5 s). */
export const countdownTick: Variants = {
  initial: { opacity: 0, scale: 1.5, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { type: "spring", duration: 0.5, bounce: 0.3 } },
  exit: { opacity: 0, scale: 0.8, transition: exitFast(partyMs.micro) },
};

/** Weitergabe aufdecken: Inhalt liegt verdeckt, wird nach „Ich bin Max“ freigelegt. */
export const handoverReveal: Variants = {
  initial: { opacity: 0, clipPath: "inset(50% 0 50% 0 round 28px)", filter: "blur(12px)" },
  animate: {
    opacity: 1,
    clipPath: "inset(0% 0 0% 0 round 28px)",
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: partyEase.out },
  },
  exit: { opacity: 0, filter: "blur(12px)", transition: exitFast(partyMs.micro) },
};

/** Bottom-Sheet (Entfernen, Profil, Dialog „zu wenige Spieler“). */
export const sheetEnter: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: partySpring.sheet },
  exit: { y: "100%", transition: { duration: 0.24, ease: partyEase.drawer } },
};

/** Abdunklung hinter Sheets. */
export const scrimFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: partyDuration.ui, ease: partyEase.out } },
  exit: { opacity: 0, transition: exitFast() },
};

/** Status-Haken/Pill (Bereit ✓, Verbunden ✓). */
export const checkPop: Variants = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1, transition: partySpring.pop },
  exit: { opacity: 0, scale: 0.8, transition: exitFast(partyMs.press) },
};

/** Reaktion steigt am TV auf und verblasst (X01). */
export const reactionFloat: Variants = {
  initial: { opacity: 0, y: 0, scale: 0.7 },
  animate: {
    opacity: [0, 1, 1, 0],
    y: -260,
    scale: [0.7, 1.15, 1, 0.9],
    transition: { duration: 2.2, ease: partyEase.out, times: [0, 0.15, 0.7, 1] },
  },
};

/** Gestaffelte Liste — Eltern-Variante. */
export const listStagger: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER_MS / 1000, delayChildren: 0.04 } },
};

/** Druck-Feedback fuer alles Antippbare. */
export const pressable = {
  whileTap: { scale: 0.97 },
  transition: { duration: partyMs.press / 1000, ease: partyEase.out } as Transition,
} as const;

export const partyVariants = {
  cardEnter,
  avatarArrive,
  seatFlip,
  profileMorph,
  leaveFade,
  countdownTick,
  handoverReveal,
  sheetEnter,
  scrimFade,
  checkPop,
  reactionFloat,
} as const;
export type PartyVariantName = keyof typeof partyVariants;

// ── Bewegungsarmut ─────────────────────────────────────────────────

const MOTION_KEYS = new Set(["x", "y", "scale", "rotate", "rotateX", "rotateY", "filter", "clipPath"]);

/**
 * Macht aus beliebigen Varianten eine stille Fassung: nur Deckkraft, 200 ms.
 * Endzustand bleibt gleich (Position/Groesse werden auf Ruhewerte gesetzt).
 */
export function reduceVariants(variants: Variants): Variants {
  const out: Variants = {};
  for (const [state, def] of Object.entries(variants)) {
    if (typeof def !== "object" || def === null) continue;
    const kept: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(def as Record<string, unknown>)) {
      if (k === "transition" || MOTION_KEYS.has(k)) continue;
      kept[k] = Array.isArray(v) ? v[v.length - 1] : v;
    }
    out[state] = { ...kept, x: 0, y: 0, scale: 1, rotate: 0, rotateY: 0, filter: "none", clipPath: "none", transition: { duration: 0.2 } };
  }
  return out;
}

/** Waehlt Varianten passend zur Einstellung — nutze mit framer `useReducedMotion()`. */
export function partyMotion(name: PartyVariantName, reduced: boolean): Variants {
  return reduced ? reduceVariants(partyVariants[name]) : partyVariants[name];
}

/** Nicht-Hook-Abfrage (TV-Szenen, Timer ausserhalb von React). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

// ── Uebergangskarte T01–T19 ────────────────────────────────────────

export type PartyDevice = "tv" | "host" | "phone";
/** Entspricht den Methoden von `useHaptics()`; `none` = bewusst still. */
export type PartyHaptic = "none" | "light" | "medium" | "heavy" | "success" | "warning" | "select" | "countdown" | "celebrate";
/** Entspricht `useTVAudio()`: chime→playChime usw. Nur am TV. */
export type PartySound = "none" | "chime" | "tick" | "correct" | "wrong" | "fanfare" | "drumroll" | "reveal";
/** Name der Darstellung; `none` = Geraet ist an diesem Uebergang unbeteiligt. */
export type PartyMotionToken =
  | PartyVariantName
  | "none"
  | "crossfade"
  | "counterBump"
  | "lookAtTv"
  | "statusSwap"
  | "timerRing"
  | "resultReveal"
  | "standingsCountUp"
  | "mapTravel"
  | "turnBanner"
  | "toast"
  | "confetti";

export interface PartyCue {
  token: PartyMotionToken;
  /** Dauer der sichtbaren Bewegung (ms). Bei `semantic` ist es eine Zeit mit Bedeutung. */
  durationMs: number;
  haptic: PartyHaptic;
  sound: PartySound;
  /** Dauer traegt Information (Countdown, Frist, Mindestanzeige) — nie kuerzen. */
  semantic?: boolean;
  /** Erst nach dieser Wartezeit zeigen (z. B. T13 „nach 2 s“). */
  delayMs?: number;
}

export type PartyTransitionId =
  | "T01" | "T02" | "T03" | "T04" | "T05" | "T06" | "T07" | "T08" | "T09" | "T10"
  | "T11" | "T12" | "T13" | "T14" | "T15" | "T16" | "T17" | "T18" | "T19";

export const PARTY_TRANSITION_IDS: readonly PartyTransitionId[] = [
  "T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10",
  "T11", "T12", "T13", "T14", "T15", "T16", "T17", "T18", "T19",
];

/** Zeitbudget je Uebergang laut Masterplan 4.2 (Obergrenze, optional Untergrenze). */
export const PARTY_TIMING_BUDGET: Record<PartyTransitionId, { maxMs: number; minMs?: number }> = {
  T01: { maxMs: 1200 }, // Animation 1,2 s
  T02: { maxMs: 1000 },
  T03: { maxMs: 1000 },
  T04: { maxMs: 320 }, // „sofort“
  T05: { maxMs: 3000, minMs: 3000 }, // 3-2-1 synchron
  T06: { maxMs: 1500 },
  T07: { maxMs: 1500 },
  T08: { maxMs: 320 },
  T09: { maxMs: 5000 }, // letzte 5 s
  T10: { maxMs: 4000 },
  T11: { maxMs: 8000 },
  T12: { maxMs: 3000 },
  T13: { maxMs: 600 },
  T14: { maxMs: 2000 },
  T15: { maxMs: 800 },
  T16: { maxMs: 5000 },
  T17: { maxMs: 800 },
  T18: { maxMs: 320 },
  T19: { maxMs: UNDO_WINDOW_MS },
};

const cue = (token: PartyMotionToken, durationMs: number, haptic: PartyHaptic = "none", sound: PartySound = "none", extra: Partial<PartyCue> = {}): PartyCue => ({
  token,
  durationMs,
  haptic,
  sound,
  ...extra,
});
const idle = cue("none", 0);

export const PARTY_TRANSITIONS: Record<PartyTransitionId, Record<PartyDevice, PartyCue>> = {
  // Spieler tritt bei
  T01: { tv: cue("avatarArrive", partyMs.arrival, "none", "chime"), host: cue("cardEnter", partyMs.ui, "light"), phone: cue("checkPop", 600, "success") },
  // Platz uebernommen 🔁→📱
  T02: { tv: cue("seatFlip", partyMs.flip, "none", "reveal"), host: cue("leaveFade", 600, "light"), phone: cue("cardEnter", partyMs.sheet, "success") },
  // Profil geaendert
  T03: { tv: cue("profileMorph", partyMs.card), host: cue("profileMorph", partyMs.ui), phone: cue("profileMorph", partyMs.ui, "select") },
  // Spieler bereit
  T04: { tv: cue("checkPop", partyMs.sheet, "none", "tick"), host: cue("counterBump", partyMs.micro, "light"), phone: cue("checkPop", partyMs.micro, "medium") },
  // Spielstart: Countdown 3-2-1 (je 1 s), danach Intro am TV
  T05: {
    tv: cue("countdownTick", 3000, "none", "tick", { semantic: true }),
    host: cue("countdownTick", 3000, "countdown", "none", { semantic: true }),
    phone: cue("countdownTick", 3000, "countdown", "none", { semantic: true }),
  },
  // Ich bin dran
  T06: { tv: cue("turnBanner", partyMs.banner, "none", "chime"), host: cue("lookAtTv", partyMs.ui), phone: cue("statusSwap", partyMs.ui, "heavy") },
  // Gast ist dran (Uhr pausiert bis „Ich bin Max“)
  T07: { tv: cue("turnBanner", partyMs.banner, "none", "chime"), host: cue("handoverReveal", 450, "medium"), phone: cue("statusSwap", partyMs.ui) },
  // Gast fertig
  T08: { tv: cue("leaveFade", 300), host: cue("statusSwap", partyMs.ui, "light"), phone: idle },
  // Zeit laeuft ab: Ring + Tick in den letzten 5 s, alle sperren zu `deadline`
  T09: {
    tv: cue("timerRing", 5000, "none", "tick", { semantic: true }),
    host: cue("statusSwap", partyMs.micro, "warning"),
    phone: cue("statusSwap", partyMs.micro, "warning"),
  },
  // Aufloesung einer Runde
  T10: { tv: cue("resultReveal", 3000, "none", "reveal"), host: cue("lookAtTv", partyMs.ui), phone: cue("cardEnter", partyMs.sheet, "success") },
  // Spielende → Zwischenstand; „Weiter“ fruehestens nach 6 s
  T11: {
    tv: cue("standingsCountUp", 7000, "none", "fanfare", { semantic: true }),
    host: cue("counterBump", 6000, "light", "none", { semantic: true }),
    phone: cue("cardEnter", 600, "medium"),
  },
  // Naechstes Spiel / Karte
  T12: { tv: cue("mapTravel", 2500), host: cue("cardEnter", partyMs.ui), phone: cue("statusSwap", partyMs.ui) },
  // Verbindung weg (TV nach 2 s, Host-Optionen nach 30 s)
  T13: {
    tv: cue("toast", 400, "none", "none", { delayMs: 2000 }),
    host: cue("sheetEnter", partyMs.sheet, "warning", "none", { delayMs: 30000 }),
    phone: cue("statusSwap", partyMs.ui, "warning"),
  },
  // Spiel abgebrochen — 2 s Hinweis, dann Wartebereich
  T14: { tv: cue("toast", 2000, "none", "wrong", { semantic: true }), host: cue("crossfade", partyMs.sheet, "warning"), phone: cue("crossfade", partyMs.sheet, "warning") },
  // Nachzuegler im Spiel — stoert nicht
  T15: { tv: cue("toast", 600, "none", "tick"), host: cue("cardEnter", partyMs.ui, "light"), phone: cue("cardEnter", partyMs.sheet, "light") },
  // Siegerehrung: Trommelwirbel → Podest → Konfetti synchron
  T16: {
    tv: cue("confetti", confettiBurst.afterDrumrollMs + confettiBurst.durationMs, "none", "drumroll", { semantic: true }),
    host: cue("confetti", confettiBurst.afterDrumrollMs + confettiBurst.durationMs, "celebrate", "none", { semantic: true }),
    phone: cue("confetti", confettiBurst.afterDrumrollMs + confettiBurst.durationMs, "celebrate", "none", { semantic: true }),
  },
  // TV gekoppelt
  T17: { tv: cue("crossfade", 600, "none", "chime"), host: cue("checkPop", partyMs.ui, "success"), phone: idle },
  // Host ruft TV-Ansicht
  T18: { tv: cue("crossfade", partyMs.sheet), host: cue("counterBump", partyMs.press, "light"), phone: idle },
  // Host entfernt Spieler — taktvoll: kein Ton, „hat die Party verlassen“
  T19: {
    tv: cue("leaveFade", 600),
    host: cue("toast", UNDO_WINDOW_MS, "medium", "none", { semantic: true }),
    phone: cue("crossfade", partyMs.sheet, "warning"),
  },
};

/** Cue fuer einen Uebergang auf einem Geraet. */
export function partyCue(id: PartyTransitionId, device: PartyDevice): PartyCue {
  return PARTY_TRANSITIONS[id][device];
}

/**
 * Wirksame Dauer: Bei Bewegungsarmut werden dekorative Bewegungen auf 200 ms
 * gekappt, Zeiten mit Bedeutung bleiben.
 */
export function partyCueDurationMs(id: PartyTransitionId, device: PartyDevice, reduced: boolean): number {
  const c = partyCue(id, device);
  return reduced && !c.semantic ? Math.min(c.durationMs, 200) : c.durationMs;
}

/**
 * Szenen-Fortschritt fuer zu spaet angekommene Szenen (Masterplan 4.1, Punkt 3):
 * Statt neu zu beginnen, springt das Geraet in die laufende Animation.
 */
export function animationProgress(startsAtLocalMs: number, nowMs: number, durationMs: number): { progress: number; remainingMs: number; waitMs: number } {
  const elapsed = nowMs - startsAtLocalMs;
  if (elapsed < 0) return { progress: 0, remainingMs: durationMs, waitMs: -elapsed };
  if (durationMs <= 0) return { progress: 1, remainingMs: 0, waitMs: 0 };
  const progress = Math.min(1, elapsed / durationMs);
  return { progress, remainingMs: Math.max(0, durationMs - elapsed), waitMs: 0 };
}

/** Haptik eines Cues ausloesen — `api` ist das Ergebnis von `useHaptics()`. */
export function firePartyHaptic(api: Partial<Record<Exclude<PartyHaptic, "none">, () => void>>, haptic: PartyHaptic): void {
  if (haptic === "none") return;
  api[haptic]?.();
}

// ── Spielerfarbe: das Leuchten, das einem folgt ────────────────────

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0) as [number, number, number];
}

/**
 * Persoenlicher Farbschein — derselbe auf TV-Karte, Host-Liste und eigenem
 * Handy (Ring + weicher Glow). Nur fuer Flaechen/Ringe, nie als Textfarbe.
 */
export function playerGlow(hex: string, strength: "soft" | "active" = "soft"): string {
  const [r, g, b] = rgb(hex);
  return strength === "active"
    ? `0 0 0 2px rgba(${r},${g},${b},0.95), 0 0 40px -4px rgba(${r},${g},${b},0.65)`
    : `0 0 0 1px rgba(${r},${g},${b},0.45), 0 0 24px -8px rgba(${r},${g},${b},0.5)`;
}

/** Relative Leuchtdichte nach WCAG. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Lesbare Textfarbe auf einer Spielerfarbe als Flaeche (≥ 4.5:1 wo moeglich). */
export function readableOn(hex: string): "#ffffff" | "#0b0b12" {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#0b0b12") ? "#ffffff" : "#0b0b12";
}
