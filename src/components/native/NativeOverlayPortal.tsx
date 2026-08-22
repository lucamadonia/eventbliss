/**
 * NativeOverlayPortal — hebt ein Overlay aus dem Seitenwechsel heraus.
 *
 * Das Problem ist kein z-index, sondern die Eindämmung: `PageTransition`
 * legt um JEDE Nicht-Tab-Route ein `<motion.div>`, dessen Varianten
 * `transform` setzen. Ein Element mit `transform ≠ none` wird laut
 * CSS-Spezifikation zweierlei — ein neuer Stapelkontext UND der
 * Bezugsrahmen für `position: fixed` darunter. Ein `fixed inset-0`-Overlay
 * darin ist deshalb, von der Wurzel aus gesehen, auf das `z-10` dieses
 * Wrappers festgenagelt, während die `BottomTabBar` mit `z-40` daneben
 * liegt und immer darüber malt. Ein höherer z-index hilft nicht: `z-[120]`
 * am Teilnehmer-Wähler hat exakt nichts geändert.
 *
 * Beweis für die Gegenprobe: Overlays auf den Tab-Wurzeln (EventsScreen,
 * ProfileScreen) funktionieren, weil `TabsLayer` sie in ein schlichtes
 * `absolute inset-0` hängt — kein transform, keine Falle.
 *
 * Dieses Portal hängt die Kinder an `document.body`, also neben die ganze
 * App-Hülle. Damit gilt wieder der Wurzel-Stapelkontext, und `z-50` schlägt
 * `z-40`.
 *
 * ANWENDUNG: außen um die `AnimatePresence` legen, nicht dazwischen —
 *
 *   <NativeOverlayPortal>
 *     <AnimatePresence>{open && <motion.div … />}</AnimatePresence>
 *   </NativeOverlayPortal>
 *
 * So bleibt das Verhältnis von `AnimatePresence` zu ihrem Kind unverändert
 * (ein Portal wechselt nur den DOM-Elternteil, nicht den React-Baum), und
 * die Exit-Animation läuft weiter wie zuvor.
 */
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function NativeOverlayPortal({ children }: { children: ReactNode }) {
  // Erst nach dem Mounten portalen. Beim Prerender (2650 Seiten, kein DOM)
  // gibt es kein `document`; so liefern Prerender und erster Client-Render
  // beide nichts und die Hydration bleibt deckungsgleich.
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.body);
  }, []);

  if (!host) return null;
  return createPortal(children, host);
}
