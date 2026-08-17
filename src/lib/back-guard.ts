/**
 * back-guard — ein gemeinsamer Stapel von Zurück-Handlern.
 *
 * Problem, das das hier löst: In der nativen App liegt der `FloatingBackButton`
 * (fixed top-left, z-[60]) genau ÜBER dem spielinternen Zurück-Pfeil. Der
 * Nutzer tippt zwangsläufig den falschen, der macht `navigate(-1)`, die Route
 * wechselt, die Spielkomponente unmountet — und weil kein Spiel seinen Stand
 * persistiert, ist die ganze Partie weg. Dasselbe gilt für die Android-
 * Hardware-Taste.
 *
 * `src/lib/native-setup.ts` war darauf schon vorbereitet und fragt vor dem
 * Zurückgehen `window.__modalStack` ab — nur hat diese Liste **nie jemand
 * befüllt**, der Schutz war toter Code. Dieses Modul füllt exakt diese
 * Struktur, damit beide Wege (Floating-Button und Hardware-Taste) denselben
 * Stapel benutzen.
 *
 * Vertrag eines Handlers: `true` zurückgeben heißt „ich habe das Zurück
 * behandelt, geh nicht navigieren". `false` heißt „nicht meine Zuständigkeit,
 * reich weiter".
 */
import { useEffect, useRef } from "react";

export type BackHandler = () => boolean;

function stack(): BackHandler[] {
  const w = window as unknown as { __modalStack?: BackHandler[] };
  if (!w.__modalStack) w.__modalStack = [];
  return w.__modalStack;
}

/**
 * Fragt die registrierten Handler von oben nach unten. Gibt `true` zurück,
 * sobald einer übernommen hat — der Aufrufer darf dann NICHT navigieren.
 */
export function runBackGuards(): boolean {
  const s = stack();
  for (let i = s.length - 1; i >= 0; i--) {
    try {
      if (s[i]()) return true;
    } catch {
      // Ein kaputter Handler darf die Navigation nicht blockieren.
    }
  }
  return false;
}

/**
 * Registriert einen Zurück-Handler für die Lebensdauer der Komponente.
 * Der zuletzt registrierte wird zuerst gefragt (verschachtelte Overlays).
 */
export function useBackGuard(handler: BackHandler, enabled = true): void {
  // Ref, damit ein sich ändernder Handler den Stapel nicht ständig neu aufbaut.
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const fn: BackHandler = () => ref.current();
    const s = stack();
    s.push(fn);
    return () => {
      const i = s.indexOf(fn);
      if (i >= 0) s.splice(i, 1);
    };
  }, [enabled]);
}
