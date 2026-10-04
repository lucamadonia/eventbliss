/**
 * scene-schedule — Szenen mit Startzeit und Fristen statt "wechsle, sobald
 * die Nachricht ankommt" (Masterplan 4.1, T-1 bis T-4, F10, F12).
 *
 * Alle Zeiten hier sind SERVERZEIT in ms (siehe scene-clock.ts). Die Helfer
 * sind rein: Sie bekommen die Uhr hereingereicht und haben keine Timer —
 * den Re-Render zum Startzeitpunkt erledigt `useScene` (useScene.ts).
 */
import { SCENE_LEAD_MS, SCENE_SKEW_BUDGET_MS } from "@/lib/party-motion";

import { serverClock } from "./scene-clock";
import { pushPartyTrace } from "./party-trace";

/**
 * Vorlauf zwischen Senden und gemeinsamem Wechsel. Eine Quelle mit der
 * Bewegungskarte (party-motion.ts), damit Szenenuhr und Animationen nicht
 * auseinanderlaufen.
 */
export const DEFAULT_SCENE_LEAD_MS = SCENE_LEAD_MS;
/** Ziel-Versatz zwischen Geraeten (G5). */
export { SCENE_SKEW_BUDGET_MS };
/** Kritische Szenen warten hoechstens so lange auf die Langsamen. */
export const CRITICAL_ACK_TIMEOUT_MS = 3000;

/** Alles, was eine Serverzeit liefern kann — `serverClock` oder ein Test-Double. */
export interface SceneClock {
  now(): number;
  toLocal?(serverMs: number): number;
}

export type Scene<T = unknown> = {
  sceneId: string;
  scene: string;
  /** Serverzeit in ms. */
  startsAt: number;
  data?: T;
};

export interface SceneProgress {
  phase: "pending" | "running";
  /** 0, sobald die Szene laeuft. */
  msUntilStart: number;
  /** > 0 bei Nachzueglern: so weit ist die Szene schon gelaufen (Animation vorspulen). */
  elapsedMs: number;
}

export interface PlanSceneOptions {
  leadMs?: number;
  clock?: SceneClock;
  /** Feste Kennung, z. B. fuer Wiederholungen derselben Szene. */
  sceneId?: string;
}

let sceneCounter = 0;
function newSceneId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  sceneCounter += 1;
  return `scene-${Date.now().toString(36)}-${sceneCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Host plant eine Szene: Start = jetzt (Serverzeit) + Vorlauf. */
export function planScene<T>(scene: string, data?: T, opts: PlanSceneOptions = {}): Scene<T> {
  const clock = opts.clock ?? serverClock;
  const lead = Math.max(0, opts.leadMs ?? DEFAULT_SCENE_LEAD_MS);
  const planned: Scene<T> = { sceneId: opts.sceneId ?? newSceneId(), scene, startsAt: clock.now() + lead };
  if (data !== undefined) planned.data = data;
  return planned;
}

/**
 * Wo steht die Szene auf DIESEM Geraet? Wer die Nachricht zu spaet bekommt,
 * startet nicht von vorn, sondern springt mit `elapsedMs` in die laufende
 * Szene.
 */
export function sceneProgress(scene: Pick<Scene, "startsAt">, clock: SceneClock = serverClock): SceneProgress {
  const delta = clock.now() - scene.startsAt;
  return delta >= 0
    ? { phase: "running", msUntilStart: 0, elapsedMs: delta }
    : { phase: "pending", msUntilStart: -delta, elapsedMs: 0 };
}

/** Serverzeit → lokale Zeit, auch fuer Uhren ohne `toLocal`. */
export function sceneLocalTime(serverMs: number, clock: SceneClock = serverClock): number {
  return clock.toLocal ? clock.toLocal(serverMs) : serverMs - (clock.now() - Date.now());
}

// --- Fristen -----------------------------------------------------------------

/** "Zeit ist um" als Uhrzeit, die alle Geraete selbst einhalten. */
export function deadline(startsAt: number, durationMs: number): number {
  return startsAt + Math.max(0, durationMs);
}

/** Genau zur Frist ist Schluss (T09); `graceMs` nur fuer die Host-Pruefung eingehender Eingaben. */
export function isPastDeadline(deadlineMs: number, clock: SceneClock = serverClock, graceMs = 0): boolean {
  return clock.now() >= deadlineMs + Math.max(0, graceMs);
}

export function remainingMs(deadlineMs: number, clock: SceneClock = serverClock): number {
  return Math.max(0, deadlineMs - clock.now());
}

export interface AcceptInputArgs {
  deadline: number;
  playerId: string;
  sceneId: string;
  clock?: SceneClock;
  /** Kulanz fuer Laufzeit der Eingabe zum Host. */
  graceMs?: number;
}

/**
 * Host-Pruefung jeder eingehenden Eingabe (F12): nach der Frist verworfen und
 * fuer die Timing-Tests protokolliert. Rueckgabe: Eingabe annehmen?
 */
export function acceptInput({ deadline: deadlineMs, playerId, sceneId, clock = serverClock, graceMs = 0 }: AcceptInputArgs): boolean {
  if (!isPastDeadline(deadlineMs, clock, graceMs)) return true;
  pushPartyTrace({ kind: "input-rejected", reason: "late", playerId, sceneId });
  return false;
}

export interface PausedDeadline {
  deadline: number;
  /** Serverzeit, zu der pausiert wurde. */
  pausedAt: number;
}

/** Frist anhalten (Pause, Weitergabe ans Host-Handy). */
export function pauseDeadline(deadlineMs: number, clock: SceneClock = serverClock): PausedDeadline {
  return { deadline: deadlineMs, pausedAt: clock.now() };
}

/** Restzeit einer angehaltenen Frist — steht still, solange pausiert ist. */
export function pausedRemainingMs(paused: PausedDeadline): number {
  return Math.max(0, paused.deadline - paused.pausedAt);
}

/**
 * Frist fortsetzen: um die Pausendauer nach hinten schieben. Eine Frist, die
 * schon vor der Pause abgelaufen war, bleibt abgelaufen.
 */
export function resumeDeadline(paused: PausedDeadline, clock: SceneClock = serverClock): number {
  return paused.deadline + Math.max(0, clock.now() - paused.pausedAt);
}

// --- Countdown (T05, T-4) ----------------------------------------------------------

export interface CountdownState {
  phase: "pending" | "counting" | "go";
  /** 3, 2, 1 waehrend `counting`; 0 ab „Los!“; null vor dem Start. */
  value: number | null;
  /** Bis zum naechsten Wechsel (fuer setTimeout); 0, wenn nichts mehr kommt. */
  msUntilNext: number;
}

/**
 * Welche Ziffer zeigt der Countdown JETZT? Aus der Szenenuhr gerechnet statt
 * mit setInterval gezaehlt — so zeigen alle Geraete dieselbe Zahl, auch wer
 * spaet dazukommt. `startsAt` = Moment, in dem die erste Ziffer erscheint.
 */
export function countdownState(startsAt: number, clock: SceneClock = serverClock, digits = 3): CountdownState {
  const now = clock.now();
  if (now < startsAt) return { phase: "pending", value: null, msUntilNext: startsAt - now };
  const remaining = startsAt + digits * 1000 - now;
  if (remaining <= 0) return { phase: "go", value: 0, msUntilNext: 0 };
  return { phase: "counting", value: Math.ceil(remaining / 1000), msUntilNext: remaining % 1000 || 1000 };
}

// --- Bestaetigungen kritischer Szenen ------------------------------------------

export interface AckInput {
  /** Aktive Geraete, deren Bestaetigung erwartet wird. */
  expected: readonly string[];
  /** Bisher eingegangene Bestaetigungen (fremde Kennungen werden ignoriert). */
  acks: Iterable<string>;
  /** Serverzeit, ab der gewartet wird (meist `startsAt`). */
  startedAt: number;
  /** Aktuelle Serverzeit. */
  now: number;
  timeoutMs?: number;
}

export interface AckStatus {
  /** Weiter: alle da ODER Wartezeit vorbei. */
  ready: boolean;
  /** Weiter, obwohl jemand fehlt — die Langsamen springen nach. */
  timedOut: boolean;
  missing: string[];
  /** Wie lange hoechstens noch gewartet wird (0, wenn `ready`). */
  waitMs: number;
}

/**
 * Spielstart und Rundenende warten auf alle aktiven Geraete, hoechstens 3 s
 * (Masterplan 4.1 Punkt 5). Rein: gleiche Eingabe, gleiches Ergebnis.
 */
export function ackTracker(input: AckInput): AckStatus {
  const timeout = Math.max(0, input.timeoutMs ?? CRITICAL_ACK_TIMEOUT_MS);
  const got = new Set(input.acks);
  const missing = [...new Set(input.expected)].filter((id) => !got.has(id));
  const waited = input.now - input.startedAt;
  if (missing.length === 0) return { ready: true, timedOut: false, missing, waitMs: 0 };
  if (waited >= timeout) return { ready: true, timedOut: true, missing, waitMs: 0 };
  return { ready: false, timedOut: false, missing, waitMs: timeout - waited };
}
