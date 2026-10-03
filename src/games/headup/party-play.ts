/**
 * HEAD UP im Party-Abend — reine Regeln fuer 🔁-Gaeste am Host-Handy und den
 * gemeinsamen Phasenwechsel (Masterplan 3.5/4.1, Design §9).
 *
 * Mechanik: Wer dran ist, haelt ein Handy an die Stirn. Mit eigenem Handy
 * zeigt es nur den eigenen Namen (die anderen lesen das Wort auf ihren
 * Handys). Ein Gast spielt mit dem HOST-Handy an der Stirn — das zeigt dann
 * wie im lokalen Spiel das Wort nach aussen. Das Wort erscheint erst nach
 * „Ich bin Max“ und dem Countdown, also nie in den Haenden des Ratenden.
 */
import { SCENE_LEAD_MS } from "@/lib/party-motion";

import { PHASE_INPUT_DELAY_MS } from "../party/phase-gate";
import { countdownState, type SceneClock } from "../party/scene-schedule";

export type HeadUpScreen = "setup" | "ready" | "playing" | "roundResult" | "gameOver";

/** Spielt dieses Geraet den aktiven Platz (eigener oder eigener Gast)? Lokal immer. */
export function isLocalActor(localSeats: readonly string[] | null, actorId: string | false | undefined): boolean {
  if (localSeats === null) return true;
  return typeof actorId === "string" && localSeats.includes(actorId);
}

/**
 * Wem gehoert der aktive Platz, der gerade die Stirn-Handlung braucht?
 * Nur in „Bereit“ und „Spielen“ — dann wird das Host-Handy an einen Gast
 * weitergegeben; danach geht es zurueck.
 */
export function headUpActiveSeat(online: boolean, screen: HeadUpScreen, actorId: string | false | undefined): string | null {
  return online && (screen === "ready" || screen === "playing") && typeof actorId === "string" ? actorId : null;
}

/**
 * Darf dieses Geraet jetzt fuer den Ratenden handeln (Bereit, Kippen, Knoepfe)?
 * Eigener Platz: nur ohne laufende Weitergabe. Gast: erst nach seiner Bestaetigung.
 */
export function actorControls(args: {
  online: boolean;
  myPlayerId?: string;
  actorId: string | false | undefined;
  localActor: boolean;
  handoverIdle: boolean;
  activeGuest: string | null;
}): boolean {
  if (!args.online) return true;
  if (!args.localActor || typeof args.actorId !== "string") return false;
  return args.actorId === args.myPlayerId ? args.handoverIdle : args.activeGuest === args.actorId;
}

/**
 * Vorlauf je Phase: Der Wechsel zu „Spielen“ folgt auf den 3-2-1-Countdown,
 * der schon der gemeinsame Takt ist — dort weder Vorlauf noch Eingabesperre,
 * sonst verloere der Ratende Sekunden seiner Runde.
 */
export function headUpPhaseLeadMs(screen: HeadUpScreen): number {
  return screen === "playing" ? 0 : SCENE_LEAD_MS;
}

export function headUpInputDelayMs(screen: HeadUpScreen): number {
  return screen === "playing" ? 0 : PHASE_INPUT_DELAY_MS;
}

/** Spieler mit voller Identitaet fuer den Fernseher — nie das Wort. */
export function headUpTvSeats(
  order: readonly string[],
  players: readonly { id: string; name: string; avatar?: string; color?: string }[],
): { id: string; name: string; avatar: string; color: string }[] {
  return order.flatMap((id) => {
    const p = players.find((candidate) => candidate.id === id);
    return p ? [{ id: p.id, name: p.name, avatar: p.avatar || p.name.slice(0, 1).toUpperCase(), color: p.color || "#df8eff" }] : [];
  });
}

/** Ziffern des Start-Countdowns (3-2-1, dann „Los!“). */
export const HEADUP_COUNTDOWN_DIGITS = 3;

/**
 * Countdown-Anzeige aus der gemeinsamen Szenenuhr statt aus Host-Takten (T-4):
 * Alle Geraete rechnen dieselbe Ziffer aus `startsAt` (Serverzeit). `null` =
 * kein Countdown; vor dem Start bereits die erste Ziffer; 0 = „Los!“.
 */
export function headUpCountdown(startsAt: number | null | undefined, clock: SceneClock): { value: number | null; msUntilNext: number } {
  if (startsAt == null || !Number.isFinite(startsAt)) return { value: null, msUntilNext: 0 };
  const state = countdownState(startsAt, clock, HEADUP_COUNTDOWN_DIGITS);
  return state.phase === "pending"
    ? { value: HEADUP_COUNTDOWN_DIGITS, msUntilNext: state.msUntilNext }
    : { value: state.value, msUntilNext: state.msUntilNext };
}

/**
 * „Zu spaet“ nur, wenn der Zug wirklich vorbei ist. Das Aktions-Token
 * (`screen:runde:wort:countdown`) tickt mit jedem Wort — ein schneller
 * Doppeltipp auf die naechste Karte ist kein verspaetetes Raten.
 */
export function headUpTurnClosed(staleTurn: string, currentTurn: string): boolean {
  const [staleScreen, staleRound] = staleTurn.split(":");
  const [screen, round] = currentTurn.split(":");
  return staleScreen !== screen || staleRound !== round;
}
