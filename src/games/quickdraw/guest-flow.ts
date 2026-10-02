/**
 * SCHNELLZEICHNER mit 🔁-Gaesten am Host-Handy (Masterplan 3.5/7, sharedDevice
 * 'turns'). Rein: welcher Platz gerade handeln muss, wie lange die Eingabe nach
 * einem Phasenwechsel gesperrt ist und was der Fernseher ueber die Spieler
 * erfaehrt.
 *
 * Ablauf: Zeichner (Wort geheim) → Ratende nacheinander (Raten bleiben bis zur
 * Aufloesung versiegelt). Jeder Zug gehoert genau einem Platz, darum reicht
 * eine Weitergabe vor jedem Zug.
 */

/** Phasen, in denen der Zeichner handelt (Wort ansehen, zeichnen). */
const DRAWER_PHASES = new Set(["drawerReveal", "drawing"]);

/**
 * Platz, der JETZT handeln muss — `null` in Phasen ohne Einzelzug (Setup,
 * Aufloesung, Ende). Spiegelt `drawer`/`guessers[currentGuesser]` aus dem Spiel.
 */
export function quickDrawActiveSeat(
  phase: string,
  players: readonly { id: string }[],
  drawerIdx: number,
  currentGuesser: number,
): string | null {
  if (!players.length) return null;
  const d = ((drawerIdx % players.length) + players.length) % players.length;
  if (DRAWER_PHASES.has(phase)) return players[d]?.id ?? null;
  if (phase === "guessing") {
    const guessers = players.filter((_, i) => i !== d);
    return guessers[currentGuesser]?.id ?? null;
  }
  return null;
}

/**
 * Einblend-Takt nach einem Phasenwechsel. Beim Zeichnen laeuft die Uhr ab dem
 * Start — dort keine zusaetzliche Sperre, sonst verliert der Zeichner Zeit.
 */
export function quickDrawInputDelay(phase: string): number | undefined {
  return phase === "drawing" ? 0 : undefined;
}

export interface TvPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
}

/** Volle oeffentliche Spieler-Identitaet fuer den TV (Symbol aus dem Raum). */
export function quickDrawTvPlayers(
  players: readonly { id: string; name: string; color: string; score: number }[],
  room: readonly { id: string; avatar?: string }[] = [],
): TvPlayer[] {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    score: p.score,
    avatar: room.find((r) => r.id === p.id)?.avatar || p.name.slice(0, 1).toUpperCase(),
  }));
}

/** Wort fuer den TV: erst ab der Aufloesung, nie vorher. */
export function quickDrawTvWord(phase: string, word: string | undefined): string | undefined {
  return phase === "roundResult" || phase === "gameOver" ? word : undefined;
}
