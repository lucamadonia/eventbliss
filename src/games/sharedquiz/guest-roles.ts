/**
 * GETEILT GEQUIZZT mit 🔁-Gaesten am Host-Handy (Masterplan 3.5, sharedDevice
 * 'secret'). Rein: Wer darf an diesem Handy was sehen, und wann?
 *
 * Grundregel: Auf dem geteilten Handy ist immer hoechstens EINE Rolle
 * sichtbar — die des Platzes, der das Handy gerade haelt. Gaeste bekommen es
 * ueber den verdeckten Weitergabe-Bildschirm (Halten zum Bestaetigen,
 * Zudecken vor dem Weitergeben). Solange ein Gast es haelt, ist die Rolle des
 * Hosts verborgen.
 *
 * Modi:
 * - Trio: Rolle 0 kennt die Frage, Rolle 1 die Antworten, Rolle 2 den Tipp und
 *   waehlt die Antwort. Die Info wird einzeln angesehen (zuerst der eigene
 *   Platz, dann die Gaeste), danach jederzeit erneut abrufbar.
 * - Kette / Alles-oder-nichts: die drei Rollen antworten nacheinander, jede
 *   Wahl bleibt bis zur Aufloesung geheim → Weitergabe vor jedem Gast-Zug.
 */

export type SharedMode = "trio" | "chain" | "allornothing";

export interface RoleQuestion {
  question: string;
  answers: string[];
  hint: string;
}

/** Was ein Platz sehen darf. Leere Felder = nicht sichtbar. */
export interface RoleView {
  role: number;
  question: string;
  answers: string[];
  hint: string;
  /** Darf jetzt eine Antwort waehlen. */
  canAnswer: boolean;
}

/** Rollen-Index eines Platzes (−1 = keine Rolle). Bei weniger als 3 Leuten kann ein Platz mehrere haben — die erste zaehlt. */
export function roleOf(players: readonly { id: string }[], roleIndices: readonly number[], seat: string): number {
  const index = players.findIndex((p) => p.id === seat);
  if (index < 0) return -1;
  return roleIndices.findIndex((r) => players.length > 0 && r % players.length === index);
}

/** Wer in Kette/Alles-oder-nichts jetzt antwortet (null = alle haben geantwortet). */
export function currentAnswerer(players: readonly { id: string }[], roleIndices: readonly number[], answered: number): string | null {
  if (answered >= roleIndices.length || players.length === 0) return null;
  return players[roleIndices[answered] % players.length]?.id ?? null;
}

/**
 * Sichtbare Info fuer `seat`. Trio: nur der eigene Teil; Kette/Alles: Frage +
 * Antworten nur fuer den, der gerade antwortet.
 */
export function roleViewFor(
  mode: SharedMode,
  q: RoleQuestion,
  players: readonly { id: string }[],
  roleIndices: readonly number[],
  answered: number,
  seat: string,
): RoleView {
  const role = roleOf(players, roleIndices, seat);
  const none: RoleView = { role, question: "", answers: [], hint: "", canAnswer: false };
  if (mode !== "trio") {
    return currentAnswerer(players, roleIndices, answered) === seat
      ? { role, question: q.question, answers: [...q.answers], hint: "", canAnswer: true }
      : none;
  }
  if (role === 0) return { ...none, question: q.question };
  if (role === 1) return { ...none, answers: [...q.answers] };
  if (role === 2) return { ...none, hint: q.hint, canAnswer: true };
  return none;
}

/** Lokale Plaetze dieses Handys mit einer Rolle — eigener Platz zuerst, dann die Gaeste. */
export function localRoleSeats(players: readonly { id: string }[], roleIndices: readonly number[], localSeats: readonly string[]): string[] {
  return localSeats.filter((seat, i) => localSeats.indexOf(seat) === i && roleOf(players, roleIndices, seat) >= 0);
}

/** Trio: Wer an diesem Handy seine Rolle noch nicht angesehen hat (eigener Platz zuerst). */
export function pendingTrioViews(roleSeats: readonly string[], seen: readonly string[]): string[] {
  return roleSeats.filter((seat) => !seen.includes(seat));
}

/** Teilt das Handy mehr als eine Rolle? Dann ist keine Rolle offen sichtbar, bis jemand sie aufruft. */
export function sharesRoles(roleSeats: readonly string[]): boolean {
  return roleSeats.length > 1;
}
