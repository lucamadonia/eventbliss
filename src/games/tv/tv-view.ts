/**
 * tv-view.ts — welche Erlebnis-Ansicht der Fernseher gerade zeigen soll.
 *
 * WARUM ES DAS BRAUCHT: `useTVGameBridge` sendet waehrend eines Spiels
 * fortlaufend `tv-state` mit `phase: 'ingame'`. Ein einmaliger Befehl "zeig
 * die Rangliste" waere nach Millisekunden wieder ueberschrieben. Der Wunsch
 * muss also Teil des ZUSTANDS sein, den jeder Broadcast mittraegt — genau wie
 * die Party-Sitzung selbst.
 *
 * Bewusst NICHT gespeichert: Beim naechsten Start des Abends soll der
 * Fernseher wieder normal mitlaufen und nicht auf einer alten Rangliste
 * kleben.
 *
 * Bewusst NUR die Erlebnis-Ansichten: Gespielt wird auf dem Telefon. Diese
 * Steuerung schaltet zwischen Intro, Zwischenstand, Nacht-Route, Siegerehrung
 * und dem laufenden Spiel um — sie greift in kein Spiel ein.
 */
import type { PartyNightState } from "./party-types";

export type TvView = PartyNightState["phase"];

let current: TvView = "ingame";
const listeners = new Set<() => void>();

export function getTvView(): TvView {
  return current;
}

export function setTvView(next: TvView): void {
  if (current === next) return;
  current = next;
  listeners.forEach((l) => l());
}

/** Zurueck auf "das Spiel laeuft" — beim Start eines Spiels. */
export function resetTvView(): void {
  setTvView("ingame");
}

export function subscribeTvView(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stabile Funktion fuer `useSyncExternalStore` im Prerender. */
export function tvViewServerSnapshot(): TvView {
  return "ingame";
}
