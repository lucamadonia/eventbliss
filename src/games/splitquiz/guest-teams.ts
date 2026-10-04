/**
 * SPLIT-QUIZ mit 🔁-Gaesten am Host-Handy (sharedDevice 'secret').
 *
 * Jedes Team sieht nur seine Haelfte der Antworten. Haelt das Host-Handy
 * Plaetze BEIDER Teams, darf es die Haelfte eines Teams nur zeigen, nachdem
 * das Handy verdeckt an jemanden aus diesem Team gegangen ist (Halten zum
 * Bestaetigen, vor dem Weitergeben zudecken).
 *
 * ENTSCHEIDUNG: Weitergaben vermeidet man am besten gar nicht erst — darum
 * kommen bei der Teamaufteilung alle Plaetze des Host-Handys ins SELBE Team,
 * solange die Teams dabei hoechstens um 2 auseinanderliegen. Erst wenn das
 * nicht geht (z. B. alle spielen am Host-Handy), werden sie geteilt, und die
 * Weitergabe sorgt dafuer, dass nie eine fremde Haelfte zu sehen ist.
 *
 * Rein: der Host wendet das in SplitQuizGame.tsx an.
 */
import { partitionRoster } from "./rules";

/** So weit duerfen die Teams fuer „Host-Handy in einem Team“ auseinanderliegen. */
export const MAX_TEAM_IMBALANCE = 2;

/**
 * Teams aus einer (bereits gemischten) Reihenfolge. Plaetze des Host-Handys
 * landen zusammen in Team A, aufgefuellt mit anderen bis zur Haelfte.
 */
export function assignTeams(orderedIds: readonly string[], localSeats: readonly string[]): [string[], string[]] {
  const ids = [...new Set(orderedIds)];
  const localSet = new Set(localSeats);
  const local = ids.filter((id) => localSet.has(id));
  const remote = ids.filter((id) => !localSet.has(id));
  if (local.length <= 1 || remote.length === 0) return partitionRoster(ids);
  const half = Math.ceil(ids.length / 2);
  if (local.length <= half) {
    const need = half - local.length;
    return [[...local, ...remote.slice(0, need)], remote.slice(need)];
  }
  // Mehr Host-Handy-Plaetze als eine Haelfte: zusammen lassen, solange es fair bleibt.
  if (local.length - remote.length <= MAX_TEAM_IMBALANCE) return [local, remote];
  return partitionRoster(ids);
}

export function teamOf(teams: readonly [readonly string[], readonly string[]], id: string | null | undefined): 0 | 1 | -1 {
  if (!id) return -1;
  return teams[0].includes(id) ? 0 : teams[1].includes(id) ? 1 : -1;
}

/** In diesen Phasen ist die Antwort-Haelfte des aktiven Teams auf dem Schirm. */
export const SECRET_PHASES = new Set(["betting", "question"]);
/** In diesen Phasen gehoert das Handy dem aktiven Team (Bereit-Knopf, Wette, Antwort). */
export const TEAM_TURN_PHASES = new Set(["handoff", "betting", "question"]);

/**
 * Wer soll das Host-Handy jetzt halten? Waehrend ein Team dran ist: ein Platz
 * dieses Teams (wer es schon hat → der Host → der erste Gast). Hat das
 * Host-Handy niemanden im aktiven Team, oder ist die Phase oeffentlich: der Host.
 */
export function desiredHolder(args: {
  teams: readonly [readonly string[], readonly string[]];
  activeTeam: number;
  phase: string;
  localSeats: readonly string[];
  myPlayerId: string;
  holder: string;
}): string {
  const { teams, activeTeam, phase, localSeats, myPlayerId, holder } = args;
  if (!TEAM_TURN_PHASES.has(phase)) return myPlayerId;
  const inTeam = localSeats.filter((id) => teams[activeTeam]?.includes(id));
  if (!inTeam.length) return myPlayerId;
  if (inTeam.includes(holder)) return holder;
  if (inTeam.includes(myPlayerId)) return myPlayerId;
  return inTeam[0];
}

type MachineView =
  | { status: "idle" }
  | { status: "handover"; playerId: string }
  | { status: "revealed"; playerId: string }
  | { status: "return"; from: string; to: string | null };

export type HandoverStep = "none" | "done" | "request" | "done+request";

/** Wer haelt das Handy laut Weitergabe-Zustand? `null` = gerade unterwegs. */
export function currentHolder(state: MachineView, myPlayerId: string): string | null {
  if (state.status === "idle") return myPlayerId;
  if (state.status === "revealed") return state.playerId;
  return null;
}

/**
 * Was die Weitergabe tun muss, damit `desired` das Handy bekommt.
 * Unterwegs wird nichts umgeplant — ausser „zurueck an den Host“ soll direkt
 * an einen Gast gehen (das kann die Weitergabe-Maschine).
 */
export function handoverStep(state: MachineView, desired: string, myPlayerId: string): HandoverStep {
  const holder = currentHolder(state, myPlayerId);
  if (holder === null) {
    return state.status === "return" && state.to === null && desired !== myPlayerId ? "request" : "none";
  }
  if (holder === desired) return "none";
  if (desired === myPlayerId) return "done";
  return state.status === "revealed" ? "done+request" : "request";
}

/**
 * Welche Team-Haelfte darf dieses Geraet zeigen? Nur die des aktiven Teams,
 * und nur, wenn der aktuelle Halter in diesem Team ist. -1 = keine.
 */
export function privateViewTeam(args: {
  teams: readonly [readonly string[], readonly string[]];
  activeTeam: number;
  phase: string;
  holder: string | null;
}): number {
  if (!SECRET_PHASES.has(args.phase) || !args.holder) return -1;
  return teamOf(args.teams, args.holder) === args.activeTeam ? args.activeTeam : -1;
}
