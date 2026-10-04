/**
 * handover-machine — wer haelt gerade das Host-Handy? (Masterplan 3.5, T07/T08)
 *
 *   idle ──request──▶ handover(Max) ──confirm──▶ revealed(Max)
 *                                                    │ done
 *          ┌──────── Queue nicht leer ───────────────┤
 *          ▼                                         ▼
 *   return(Max → Gerda) ──confirm──▶ revealed(Gerda)  return(Gerda → Host) ──confirm──▶ idle
 *
 * Folgen mehrere Gaeste aufeinander, geht das Handy direkt weiter
 * („Weiter an Gerda“), ohne Umweg ueber den Host. Die Spieluhr steht, solange
 * das Handy unterwegs ist (`handover`, `return`) — der Inhalt ist dann
 * verdeckt und niemand verliert Zeit durchs Weiterreichen.
 *
 * Rein und ohne React: Der Reducer laesst sich so im Test und im
 * Host-Spielverlauf gleich benutzen.
 */

export type HandoverState =
  | { status: "idle" }
  /** Handy geht vom Host an `playerId`. Inhalt verdeckt. */
  | { status: "handover"; playerId: string; queue: string[] }
  /** `playerId` hat bestaetigt und ist am Zug. */
  | { status: "revealed"; playerId: string; queue: string[] }
  /** `from` ist fertig; Handy geht an `to` (naechster Gast) oder an den Host (`to: null`). */
  | { status: "return"; from: string; to: string | null; queue: string[] };

export type HandoverEvent =
  /**
   * Diese Gaeste sind (nacheinander) dran. Laeuft schon eine Weitergabe, werden
   * sie angehaengt — ohne die, die schon warten oder gerade dran sind.
   */
  | { type: "request"; playerIds: readonly string[] }
  /** Empfaenger bestaetigt „Ich bin Max“ bzw. der Host „Ich bin Luca“. */
  | { type: "confirm" }
  /** Der aktive Gast ist mit seinem Zug fertig. */
  | { type: "done" }
  /** Abbruch (Spielende, Abbruch): sofort zurueck zu idle. */
  | { type: "cancel" }
  /** Gast wurde entfernt — Weitergaben an ihn entfallen sofort (6.6). */
  | { type: "remove"; playerId: string };

export const initialHandoverState: HandoverState = { status: "idle" };

/** Reihenfolge behalten, Doppelte und direkte Wiederholungen entfernen. */
function uniq(ids: readonly string[], exclude?: string): string[] {
  const out: string[] = [];
  for (const id of ids) if (id && id !== exclude && !out.includes(id)) out.push(id);
  return out;
}

/** Naechster Schritt, nachdem `from` fertig ist. */
function after(from: string, queue: string[]): HandoverState {
  const [next = null, ...rest] = queue;
  return { status: "return", from, to: next, queue: rest };
}

export function handoverReducer(state: HandoverState, event: HandoverEvent): HandoverState {
  switch (event.type) {
    case "request": {
      if (state.status === "idle") {
        const [first, ...rest] = uniq(event.playerIds);
        return first ? { status: "handover", playerId: first, queue: rest } : state;
      }
      if (state.status === "return" && state.to === null) {
        // Handy ist auf dem Weg zum Host, aber es kommt gleich der naechste Gast:
        // direkt weitergeben statt Umweg.
        const [first, ...rest] = uniq(event.playerIds);
        return first ? { ...state, to: first, queue: rest } : state;
      }
      const current = state.status === "return" ? state.to ?? undefined : state.playerId;
      const queue = uniq([...state.queue, ...event.playerIds], current);
      return queue.length === state.queue.length ? state : { ...state, queue };
    }

    case "confirm":
      if (state.status === "handover") return { status: "revealed", playerId: state.playerId, queue: state.queue };
      if (state.status === "return") {
        return state.to === null
          ? initialHandoverState
          : { status: "revealed", playerId: state.to, queue: state.queue };
      }
      return state;

    case "done":
      return state.status === "revealed" ? after(state.playerId, state.queue) : state;

    case "cancel":
      return state.status === "idle" ? state : initialHandoverState;

    case "remove": {
      const id = event.playerId;
      if (state.status === "idle") return state;
      const queue = state.queue.filter((q) => q !== id);
      if (state.status === "handover" && state.playerId === id) {
        // Er hat das Handy noch nicht: direkt an den naechsten, sonst bleibt es beim Host.
        const [next, ...rest] = queue;
        return next ? { status: "handover", playerId: next, queue: rest } : initialHandoverState;
      }
      if (state.status === "revealed" && state.playerId === id) return after(id, queue);
      if (state.status === "return" && state.to === id) return after(state.from, queue);
      return queue.length === state.queue.length ? state : { ...state, queue };
    }
  }
}

/** Spieluhr anhalten? Waehrend das Handy unterwegs ist: ja. */
export function isClockPaused(state: HandoverState): boolean {
  return state.status === "handover" || state.status === "return";
}

/** Wer spielt gerade am Host-Handy (nur nach Bestaetigung). */
export function activeGuest(state: HandoverState): string | null {
  return state.status === "revealed" ? state.playerId : null;
}

/** Wem gehoert das Handy gleich? `null` = Host. `undefined` = keine Weitergabe aktiv. */
export function handoverRecipient(state: HandoverState): string | null | undefined {
  if (state.status === "handover") return state.playerId;
  if (state.status === "return") return state.to;
  return undefined;
}
