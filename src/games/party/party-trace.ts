/**
 * party-trace — Messpunkte fuer die Timing-Tests (Masterplan 4.4, T-1…T-3, F12).
 *
 * Jedes Geraet (TV, Host, Handy) schreibt in denselben Ringpuffer
 * `window.__partyPlayTrace`; die E2E-Harness liest ihn aus und vergleicht
 * `shownAt` ueber Geraete hinweg. `shownAt` ist echte Wanduhr
 * (performance.timeOrigin + performance.now()), NICHT Date.now() — die Tests
 * verstellen Date.now() absichtlich, um den Uhrabgleich zu pruefen.
 *
 * Kostet im Betrieb nur ein Array-Push; ohne `window` (Node, SSR) ein No-op.
 */

export type PartyTraceDevice = "tv" | "host" | "phone";

export type PartyTraceEntry =
  | {
      kind: "scene";
      sceneId: string;
      scene: string;
      device: PartyTraceDevice;
      /** Serverzeit in ms. */
      startsAt: number;
      /** Echte Wanduhr beim ersten sichtbaren Frame. */
      shownAt: number;
      localNow: number;
      /** Geschaetzter Versatz Server - lokal. */
      offsetMs: number;
      /** Nachricht kam nach startsAt an → Szene wurde vorgespult. */
      late: boolean;
    }
  | { kind: "clock-sync"; offsetMs: number; rttMs: number; samples: number }
  | { kind: "input-rejected"; reason: "late"; playerId: string; sceneId: string }
  /** Bildschirm wurde sichtbar (party-client ui-trace). `at` = wallClockNow(). */
  | { kind: "ui"; screen: string; device: PartyTraceDevice; at: number };

export const PARTY_TRACE_LIMIT = 500;

declare global {
  interface Window {
    __partyPlayTrace?: PartyTraceEntry[];
  }
}

let device: PartyTraceDevice = "phone";

/** Einmal pro Geraet setzen: TV-Ansicht → 'tv', Host-Handy → 'host'. */
export function setPartyTraceDevice(next: PartyTraceDevice): void {
  device = next;
}

export function partyTraceDevice(): PartyTraceDevice {
  return device;
}

/** Echte Wanduhr, unabhaengig von einem verstellten Date.now(). */
export function wallClockNow(): number {
  if (typeof performance !== "undefined" && typeof performance.timeOrigin === "number") {
    return performance.timeOrigin + performance.now();
  }
  return Date.now();
}

export function pushPartyTrace(entry: PartyTraceEntry): void {
  if (typeof window === "undefined") return;
  const buf = (window.__partyPlayTrace ??= []);
  buf.push(entry);
  if (buf.length > PARTY_TRACE_LIMIT) buf.splice(0, buf.length - PARTY_TRACE_LIMIT);
}
