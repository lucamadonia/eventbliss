/**
 * Die EINE Stelle, an der entschieden wird, ob ein Spiel seinen eigenen
 * Zurück-Knopf überhaupt zeichnen muss.
 *
 * Hintergrund: In der App lag der `FloatingBackButton` der Hülle (fixed
 * top-left, z-[60]) genau über dem spielinternen Zurück-Pfeil. Der Nutzer sah
 * zwei Zurück-Knöpfe übereinander, traf zwangsläufig den falschen und landete
 * woanders als erwartet.
 */
import { isNative } from "@/lib/platform";

/**
 * Stellt die Hülle um das Spiel herum bereits einen Zurück-Knopf?
 *
 * Die Frage ist BEWUSST nicht „laufen wir nativ". Dass beides heute dasselbe
 * bedeutet, ist ein Zufall der aktuellen Routen:
 *
 *   - App.tsx verzweigt auf `isNative()` und rendert dann NativeApp. Dort läuft
 *     `/games/:gameId` durch NativeStackPage mit `fullscreen: true`, und genau
 *     dieser Zweig rendert den FloatingBackButton.
 *   - Der Web-Baum in App.tsx rendert `<GamesHub/>` nackt — keine
 *     NativeStackPage, kein MobileHeader, kein schwebender Pfeil. Dort ist der
 *     spieleigene Knopf der EINZIGE Weg aus einem Spiel heraus.
 *
 * `isNative()` ist damit heute ein exakter Stellvertreter für die eigentliche
 * Regel, aber eben nur ein Stellvertreter. Bekommt die Web-Hülle je einen
 * eigenen Zurück-Knopf — oder hört die native Spielroute auf, `fullscreen` zu
 * sein — gehört die Änderung HIERHIN und nicht in die 17 Aufrufstellen.
 */
export function hasShellBackButton(): boolean {
  return isNative();
}
