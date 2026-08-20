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

// `globalThis` statt `window`: identisch im Browser (dort IST globalThis das
// window-Objekt, `__modalStack` bleibt also dieselbe Liste), aber ohne
// Referenzfehler außerhalb eines Browsers — im Prerender und im Test.
function stack(): BackHandler[] {
  const g = globalThis as unknown as { __modalStack?: BackHandler[] };
  if (!g.__modalStack) g.__modalStack = [];
  return g.__modalStack;
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
 * Rang eines Handlers.
 *
 * `overlay` — der Regelfall: Dialoge, Phasenrückwege, „wirklich verlassen?".
 * Der zuletzt registrierte wird zuerst gefragt, verschachtelte Overlays lösen
 * sich damit von innen nach außen auf.
 *
 * `route` — der Rückfall einer ganzen Route („aus einem Spiel geht es zurück
 * zur Spieleübersicht"). Wird IMMER zuletzt gefragt, damit ein laufendes Spiel
 * seinen Bestätigungsdialog behält.
 */
export type BackPriority = 'overlay' | 'route';

/**
 * Handler eintragen. Liefert die Funktion zum Austragen zurück.
 *
 * Bewusst ohne React, damit sich die Reihenfolge testen lässt — sie ist der
 * ganze Kern dieses Moduls und im laufenden Programm unsichtbar.
 *
 * ACHTUNG beim Rang `route`: Der Handler wird VORN eingefügt statt hinten
 * angehängt, und das ist kein Schönheitsfehler, sondern der ganze Punkt. Über
 * die Mount-Reihenfolge ließe sich „zuletzt fragen" NICHT erreichen — React
 * führt Kind-Effekte vor Eltern-Effekten aus. Ein Rückfall, den die Route um
 * das Spiel herum registriert, landete deshalb ÜBER dem Handler des Spiels und
 * würde zuerst gefragt: Der Zurück-Knopf spränge dann mitten in der Partie
 * ohne Nachfrage zur Spieleübersicht, und die Partie wäre weg. Das `unshift`
 * macht die Reihenfolge unabhängig davon, wann wer mountet.
 */
export function registerBackGuard(
  handler: BackHandler,
  priority: BackPriority = 'overlay',
): () => void {
  const s = stack();
  if (priority === 'route') s.unshift(handler);
  else s.push(handler);
  return () => {
    const i = s.indexOf(handler);
    if (i >= 0) s.splice(i, 1);
  };
}

/** Registriert einen Zurück-Handler für die Lebensdauer der Komponente. */
export function useBackGuard(
  handler: BackHandler,
  enabled = true,
  priority: BackPriority = 'overlay',
): void {
  // Ref, damit ein sich ändernder Handler den Stapel nicht ständig neu aufbaut.
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return registerBackGuard(() => ref.current(), priority);
  }, [enabled, priority]);
}
