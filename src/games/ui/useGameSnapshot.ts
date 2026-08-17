/**
 * useGameSnapshot — Spielstand über Navigation hinweg retten.
 *
 * Warum: Spiele halten ihren kompletten Zustand in lokalem `useState` und
 * hängen an einer Route. Jeder Pfadwechsel (nativer Zurück-Button, Hardware-
 * Taste, Browser-Zurück, ein eingehender Deep-Link) unmountet die Komponente —
 * und damit war die ganze Partie weg. Der Zurück-Guard (`src/lib/back-guard.ts`)
 * fängt die häufigsten Fälle ab, aber nicht alle; dieses Modul ist das Netz
 * darunter.
 *
 * Bewusst KEIN React-State: das hier ist reine Ablage. Die Spiele entscheiden
 * selbst, wann sie schreiben, lesen und löschen.
 *
 * Muster übernommen von `src/hooks/usePartySession.ts` (localStorage + Lazy-
 * Init) und `src/games/multiplayer/useGameRoom.ts` (TTL, damit ein vergessener
 * Stand von gestern nicht plötzlich wieder auftaucht).
 */

const PREFIX = "eb.gamesnap.";
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2h — wie getSavedRoom()
const SCHEMA_VERSION = 1;

interface Envelope<T> {
  v: number;
  at: number;
  data: T;
}

function keyFor(gameId: string): string {
  return PREFIX + gameId;
}

/** Speichert den Stand. Fehler (privater Modus, volles Quota) sind egal. */
export function saveSnapshot<T>(gameId: string, data: T): void {
  try {
    const env: Envelope<T> = { v: SCHEMA_VERSION, at: Date.now(), data };
    localStorage.setItem(keyFor(gameId), JSON.stringify(env));
  } catch {
    // Persistenz ist ein Komfortgewinn, kein Muss — nie das Spiel daran hindern.
  }
}

/**
 * Liest den Stand zurück. Gibt `null`, wenn nichts da ist, der Eintrag zu alt
 * ist oder aus einer älteren Schemaversion stammt (dann wird er entsorgt).
 */
export function loadSnapshot<T>(gameId: string, ttlMs = DEFAULT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(keyFor(gameId));
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    if (env?.v !== SCHEMA_VERSION || typeof env.at !== "number") {
      clearSnapshot(gameId);
      return null;
    }
    if (Date.now() - env.at > ttlMs) {
      clearSnapshot(gameId);
      return null;
    }
    return env.data ?? null;
  } catch {
    clearSnapshot(gameId);
    return null;
  }
}

/** Löschen — beim Spielende, Neustart und bewussten Verlassen aufrufen. */
export function clearSnapshot(gameId: string): void {
  try {
    localStorage.removeItem(keyFor(gameId));
  } catch {
    // s.o.
  }
}
