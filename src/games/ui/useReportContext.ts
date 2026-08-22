/**
 * useReportContext — was läuft gerade, damit man es melden kann.
 *
 * Das Problem: Der Melde-Knopf sitzt in der Hülle (`GamesHub` → `GameTitleBar`),
 * der zu meldende Inhalt aber im Spiel. Jedes der rund zwanzig Spiele hält
 * seinen Zustand in lokalem `useState`; nach oben durchgereicht wird nichts. Ein
 * Knopf ohne diesen Kanal könnte nur "irgendwas in Spiel X ist kaputt" melden —
 * und damit wäre niemandem geholfen.
 *
 * Bewusst KEIN React-Context und kein Store: Ein Context zwänge jedes Spiel in
 * einen Provider, und ein Store wäre für einen einzigen veränderlichen Wert
 * überdimensioniert. Stattdessen dasselbe Muster wie `useGameSnapshot.ts` —
 * schlichte Modulablage, plus ein winziges Abonnement, damit der Dialog beim
 * Öffnen den aktuellen Stand sieht.
 *
 * Bewusst NICHT persistiert: Ein Kontext von gestern wäre schlimmer als keiner,
 * weil er eine falsche Inhalts-ID an eine echte Meldung hängt.
 */
import { useEffect, useState } from "react";

export interface ReportContext {
  /** Spiel, in dem gemeldet wird — z. B. "closeenough", "ohrwurm". */
  gameId: string;
  /**
   * Stabile Kennung des gemeldeten Inhalts, soweit vorhanden.
   *
   * NAH DRAN und OHRWURM liefern echte UUIDs aus der Datenbank. Bei Spielen mit
   * handgepflegten Inhaltsdateien (GETEILT & GEQUIZZT, FAKE OR FACT,
   * EMOJI-RATEN) gibt es keine ID — dort bleibt dieses Feld leer und `label`
   * trägt den Fragetext. Das ist unschön, aber besser als eine erfundene ID.
   */
  contentId?: string;
  /** Menschenlesbar, damit die Meldung ohne Datenbankabfrage verständlich ist. */
  label?: string;
  /** Freie Zusatzangaben: Antwortwert, Quelle, tote URL, Diagnosecode. */
  extra?: Record<string, string | number | null | undefined>;
}

let current: ReportContext | null = null;
const listeners = new Set<(ctx: ReportContext | null) => void>();

function emit(): void {
  for (const fn of listeners) fn(current);
}

/**
 * Setzt, was gerade gemeldet werden könnte.
 *
 * Aufruf gehört dorthin, wo der Inhalt wechselt — also in denselben Effekt, der
 * die nächste Frage oder den nächsten Song zieht.
 */
export function setReportContext(ctx: ReportContext | null): void {
  current = ctx;
  emit();
}

/** Beim Verlassen eines Spiels aufrufen, damit nichts Altes hängen bleibt. */
export function clearReportContext(): void {
  if (current === null) return;
  current = null;
  emit();
}

/** Nur lesen, ohne Abonnement — für Stellen außerhalb von React. */
export function getReportContext(): ReportContext | null {
  return current;
}

/** Liest den aktuellen Kontext und rendert neu, wenn er sich ändert. */
export function useReportContext(): ReportContext | null {
  const [ctx, setCtx] = useState<ReportContext | null>(current);

  useEffect(() => {
    // Zwischen Render und Effekt kann der Kontext bereits gewechselt haben —
    // deshalb einmal nachziehen, statt sich auf den Startwert zu verlassen.
    setCtx(current);
    listeners.add(setCtx);
    return () => {
      listeners.delete(setCtx);
    };
  }, []);

  return ctx;
}
