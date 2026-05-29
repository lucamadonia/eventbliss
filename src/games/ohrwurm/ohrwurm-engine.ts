// OHRWURM — Spiel-Logik (rein, ohne UI/State-Hooks)
// Implementiert die verbindlichen Regeln aus der Spec §2.
//
// Eine Timeline ist immer chronologisch aufsteigend nach `year` sortiert.
// Zwischen N Karten gibt es N+1 Slots (Index 0 … N): Slot i liegt links von
// Karte i. Der linke Rand von Slot 0 ist -Infinity, der rechte Rand von
// Slot N ist +Infinity (Spec §2.6).

import { getAllSongs, type Song } from './ohrwurm-content';

export type { Song };

export type ParticipantType = 'player' | 'group';

export interface Participant {
  id: string;
  name: string;
  type: ParticipantType;
  color: string;
  avatar: string;
  timeline: Song[]; // chronologisch sortiert nach year
  hooks: number;
}

export type Phase =
  | 'setup'
  | 'draw'        // aktive Person zieht & hört (QR sichtbar)
  | 'place'       // aktive Person ordnet ein
  | 'counter'     // Konter-Fenster für andere
  | 'counterPlace'// Konternde Person platziert in der Timeline der aktiven Person
  | 'reveal'      // Karte aufgedeckt + Auflösung
  | 'gameOver';

export interface PendingPlacement {
  slotIndex: number;
}

export interface PendingCounter {
  participantId: string;
  slotIndex: number;
}

/** Ergebnis der Auflösung einer Runde (Spec §2.3 Phase 4/5). */
export interface RoundResolution {
  /** Lag die aktive Person richtig? */
  activeCorrect: boolean;
  /** Lag der Konter richtig? (nur relevant wenn Konter existiert) */
  counterCorrect: boolean | null;
  /** Wer bekommt die Karte? null = zurück auf den Stapel. */
  winnerId: string | null;
  /** Slot, an dem die Karte beim Gewinner einsortiert wird. */
  winnerSlotIndex: number | null;
  /** Darf die aktive Person den Bonus-Hook verdienen? (nur wenn sie die Karte bekam) */
  bonusEligible: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Stapel bauen — optional auf ein Genre gefiltert (Genre-Battle). */
export function buildDeck(genre?: string | null): Song[] {
  const all = getAllSongs();
  const pool = genre ? all.filter((s) => s.genre === genre) : all;
  return shuffle(pool);
}

/**
 * Grenzen eines Slots in einer sortierten Timeline.
 * Slot i: links = timeline[i-1].year (oder -Inf), rechts = timeline[i].year (oder +Inf).
 */
export function slotBounds(
  timeline: readonly Song[],
  slotIndex: number,
): { left: number; right: number } {
  const left = slotIndex > 0 ? timeline[slotIndex - 1].year : -Infinity;
  const right = slotIndex < timeline.length ? timeline[slotIndex].year : Infinity;
  return { left, right };
}

/**
 * Ist die Platzierung korrekt? Gleiche Jahre zählen als korrekt, solange das
 * Jahr im Bereich des Slots liegt (≤ links, ≥ rechts) — Spec §2.6.
 */
export function isPlacementCorrect(
  timeline: readonly Song[],
  slotIndex: number,
  song: Song,
): boolean {
  const { left, right } = slotBounds(timeline, slotIndex);
  return song.year >= left && song.year <= right;
}

/** Karte chronologisch korrekt in eine Timeline einsortieren (immutable). */
export function insertSorted(timeline: readonly Song[], song: Song): Song[] {
  const next = [...timeline, song];
  next.sort((a, b) => a.year - b.year);
  return next;
}

/**
 * Findet den ersten korrekten Slot für einen Song in einer Timeline.
 * (Für die KI-freie „korrekte Position"-Anzeige in der Auflösung.)
 */
export function correctSlotIndex(timeline: readonly Song[], song: Song): number {
  for (let i = 0; i <= timeline.length; i++) {
    if (isPlacementCorrect(timeline, i, song)) return i;
  }
  return timeline.length;
}

/**
 * Auflösungs-Logik gemäß Spec §2.3 Phase 4:
 *
 * | Aktiv | Konter | Ergebnis |
 * |-------|--------|----------|
 * | richtig | — | Aktiv behält Karte |
 * | falsch  | — | zurück auf Stapel |
 * | richtig | egal | Aktiv behält Karte (Konter verpufft) |
 * | falsch  | richtig | Konter klaut Karte |
 * | falsch  | falsch | zurück auf Stapel |
 *
 * @param activeId        ID der aktiven Person
 * @param activeTimeline  Timeline der aktiven Person (vor Einordnen)
 * @param placement       Wo die aktive Person platziert hat
 * @param counter         Konter (oder null)
 * @param song            Die gespielte Karte
 */
export function resolveRound(
  activeId: string,
  activeTimeline: readonly Song[],
  placement: PendingPlacement,
  counter: PendingCounter | null,
  song: Song,
): RoundResolution {
  const activeCorrect = isPlacementCorrect(activeTimeline, placement.slotIndex, song);

  // Kein Konter
  if (!counter) {
    return {
      activeCorrect,
      counterCorrect: null,
      winnerId: activeCorrect ? activeId : null,
      winnerSlotIndex: activeCorrect ? placement.slotIndex : null,
      bonusEligible: activeCorrect,
    };
  }

  // Konter wird immer in der Timeline der AKTIVEN Person platziert (Spec §2.3 Phase 3.8).
  const counterCorrect = isPlacementCorrect(activeTimeline, counter.slotIndex, song);

  if (activeCorrect) {
    // Konter verpufft, aktive Person behält die Karte.
    return {
      activeCorrect,
      counterCorrect,
      winnerId: activeId,
      winnerSlotIndex: placement.slotIndex,
      bonusEligible: true,
    };
  }

  // Aktive Person lag falsch.
  if (counterCorrect) {
    // Konter klaut die Karte → landet in der Timeline der konternden Person,
    // dort an der korrekten chronologischen Position (eigene Timeline ≠ aktive).
    return {
      activeCorrect,
      counterCorrect,
      winnerId: counter.participantId,
      winnerSlotIndex: null, // beim Stealer wird via insertSorted einsortiert
      bonusEligible: false,
    };
  }

  // Beide falsch → zurück auf den Stapel.
  return {
    activeCorrect,
    counterCorrect,
    winnerId: null,
    winnerSlotIndex: null,
    bonusEligible: false,
  };
}

/** Hat eine Person das Spielziel erreicht? */
export function hasWon(p: Participant, winTarget: number): boolean {
  return p.timeline.length >= winTarget;
}
