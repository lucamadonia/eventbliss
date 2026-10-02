/**
 * scene-clock — gemeinsame Uhr aller Party-Geraete (Masterplan 4.1, T-3).
 *
 * Jedes Geraet schaetzt seinen Versatz zur Serverzeit aus den RPC-Antworten
 * (`now()` des Servers), NTP-artig: Die Antwort ist irgendwo zwischen Senden
 * und Empfangen entstanden, am wahrscheinlichsten in der Mitte. Szenen tragen
 * `startsAt` in Serverzeit; jedes Geraet rechnet sie mit diesem Versatz in
 * die eigene Uhr um. Eine Handy-Uhr, die 5 Minuten falsch geht, wechselt
 * dadurch trotzdem im selben Moment wie alle anderen.
 *
 * WARUM DIE MESSUNG MIT DER KUERZESTEN LAUFZEIT ZAEHLT (und nicht der
 * Mittelwert): Ein einzelner Ausreisser — WLAN-Aussetzer, Funkloch — macht
 * die Laufzeit gross und asymmetrisch. Der Fehler der Schaetzung ist hoechstens
 * die halbe Laufzeit; die schnellste Messung ist also die genaueste.
 */

import { pushPartyTrace } from "./party-trace";

/** Messungen mit laengerer Laufzeit sind zu ungenau (Fehler bis rtt/2). */
export const MAX_SAMPLE_RTT_MS = 5000;
/** So viele Messungen werden behalten. */
export const CLOCK_SAMPLE_WINDOW = 5;

/**
 * Postgres liefert `2026-10-01T13:23:29.470694+00:00` (Mikrosekunden, oft mit
 * Leerzeichen statt "T"). Nicht jede JS-Engine (aeltere WebViews/Safari)
 * versteht mehr als 3 Nachkommastellen — auf Millisekunden kuerzen.
 */
export function parseServerTime(value: string): number {
  const normalized = String(value)
    .trim()
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    // Kurz-Offset "+00" / "+0530" → "+00:00" / "+05:30"
    .replace(/(T[\d:.]+)([+-]\d{2})(\d{2})?$/, (_m, time: string, h: string, m?: string) => `${time}${h}:${m ?? "00"}`);
  return Date.parse(normalized);
}

interface ClockSample {
  offset: number;
  rtt: number;
}

export class ServerClock {
  private samples: ClockSample[] = [];
  private bestOffset = 0;
  private listeners = new Set<() => void>();

  constructor(private readonly localNow: () => number = () => Date.now()) {}

  /**
   * Eine Messung aufnehmen. `sentAtMs`/`receivedAtMs` sind lokale Zeiten
   * (Date.now()) rund um den RPC-Aufruf, `serverNowIso` dessen `now()`.
   * Unbrauchbare Messungen (kaputtes Datum, negative oder zu lange Laufzeit)
   * werden still verworfen — die Uhr bleibt dann beim letzten guten Stand.
   */
  sample(serverNowIso: string, sentAtMs: number, receivedAtMs: number): void {
    const serverMs = parseServerTime(serverNowIso);
    const rtt = receivedAtMs - sentAtMs;
    if (!Number.isFinite(serverMs) || !Number.isFinite(rtt)) return;
    if (rtt < 0 || rtt > MAX_SAMPLE_RTT_MS) return;

    const offset = serverMs - (sentAtMs + rtt / 2);
    this.samples = [...this.samples, { offset, rtt }].slice(-CLOCK_SAMPLE_WINDOW);

    const best = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
    const changed = best.offset !== this.bestOffset || this.samples.length === 1;
    this.bestOffset = best.offset;
    pushPartyTrace({ kind: "clock-sync", offsetMs: best.offset, rttMs: rtt, samples: this.samples.length });
    if (changed) this.listeners.forEach((fn) => fn());
  }

  /** Serverzeit in ms (Schaetzung). Ohne Messung: die lokale Uhr. */
  now(): number {
    return this.localNow() + this.bestOffset;
  }

  /** Serverzeit → lokale Zeit (fuer setTimeout/Animationen). */
  toLocal(serverMs: number): number {
    return serverMs - this.bestOffset;
  }

  /** Server minus lokal, in ms. Positiv = die lokale Uhr geht nach. */
  offset(): number {
    return this.bestOffset;
  }

  hasSync(): boolean {
    return this.samples.length > 0;
  }

  /** Meldet jede Aenderung des Versatzes. Rueckgabe: abmelden. */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Nur fuer Tests und beim Verlassen einer Party. */
  reset(): void {
    this.samples = [];
    this.bestOffset = 0;
    this.listeners.forEach((fn) => fn());
  }
}

/** Die eine Uhr der App. */
export const serverClock = new ServerClock();
