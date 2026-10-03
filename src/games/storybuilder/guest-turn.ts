/**
 * STORY BUILDER am Host-Handy (sharedDevice 'turns', Masterplan 3.5/7).
 *
 * Entscheidung: `turns` OHNE Zudecken. Wer schreibt, sieht ohnehin nur den
 * letzten Satz — und genau den soll er sehen. Online zeigt jedes Handy den
 * letzten Satz, es gibt also nichts, was beim Weiterreichen verdeckt werden
 * muesste. Darum einfache Weitergabe (Tippen), Uhr steht waehrend der Uebergabe.
 *
 * Reine Helfer: wer gerade schreibt, wann ein neuer Takt beginnt, ob die Uhr laeuft.
 */

export type StoryPhase = 'setup' | 'writing' | 'passing' | 'storyReveal' | 'gameOver';

/** Platz, der jetzt handeln muss — nur beim Schreiben (Online kennt kein 'passing'). */
export function writerSeat(phase: StoryPhase, writerId: string | null | undefined): string | null {
  return phase === 'writing' && writerId ? writerId : null;
}

/**
 * Schluessel fuer den gemeinsamen Takt: jede neue Phase UND jeder neue Zug
 * (Runde, Person, Satz) ist ein eigener Wechsel, den alle Geraete gleichzeitig
 * vollziehen. Die Phase steht vorn, damit sie sich zurueckgewinnen laesst.
 */
export function storyBeatKey(phase: StoryPhase, round: number, writerIdx: number, sentenceNum: number): string {
  return phase === 'writing' || phase === 'passing' ? `${phase}:${round}:${writerIdx}:${sentenceNum}` : phase;
}

export function phaseOfBeat(key: string): StoryPhase {
  return key.split(':')[0] as StoryPhase;
}

export interface WritingClockInput {
  phase: StoryPhase;
  seconds: number;
  /** Lokal (kein online) oder Host — nur dort laeuft die Uhr. */
  authoritative: boolean;
  /** Handy wird gerade an einen Gast weitergereicht oder er hat noch nicht bestaetigt. */
  handoverPaused: boolean;
  connected: boolean;
}

/** Laeuft die 90-Sekunden-Uhr gerade? */
export function writingClockRuns({ phase, seconds, authoritative, handoverPaused, connected }: WritingClockInput): boolean {
  return phase === 'writing' && seconds > 0 && authoritative && connected && !handoverPaused;
}

/** Zeit abgelaufen → Zug ueberspringen (nur wer die Uhr fuehrt, nie waehrend der Uebergabe). */
export function writingTimedOut(input: WritingClockInput): boolean {
  return input.phase === 'writing' && input.seconds === 0 && input.authoritative && input.connected && !input.handoverPaused;
}

/**
 * „Zu spaet“ nur, wenn der Schreibzug wirklich vorbei ist. Das Aktions-Token
 * (`phase:runde:spieler:satz:anzahl`) tickt mit jedem Satz desselben Zugs —
 * ein schneller zweiter Satz ist kein verspaeteter.
 */
export function storyTurnClosed(staleTurn: string, currentTurn: string): boolean {
  const a = staleTurn.split(":"), b = currentTurn.split(":");
  return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2];
}
