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

/**
 * Sicherheitsnetz fuer den exakten Moment, in dem ein Party-Spiel endet.
 *
 * Das Telefon schreibt Ergebnis und TV-Zustand in zwei aufeinanderfolgenden
 * React-Effekten. Fuer wenige Millisekunden kann deshalb bereits `gameOver`
 * anliegen, waehrend die Erlebnis-Ansicht noch `ingame` lautet. Ohne diese
 * Ableitung faellt der Fernseher in die generische Einzelspiel-Rangliste.
 * Explizite Ansichten des Hosts (Karte, Regeln, Finale, ...) bleiben unangetastet.
 */
export function resolveTvView(
  requested: TvView,
  options: { partyActive: boolean; gameOver: boolean },
): TvView {
  if (options.partyActive && options.gameOver && requested === "ingame") return "between";
  return requested;
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

/**
 * Soll vor jedem Spiel die Anleitung auf dem Fernseher stehen?
 *
 * Bewusst hier und nicht in der Party-Sitzung: Es ist eine Vorliebe der
 * Gruppe, keine Eigenschaft des Abends — wer die Spiele kennt, will sie
 * dauerhaft aus haben, nicht bei jeder neuen Party erneut abschalten.
 *
 * Vorgabe AN: Der haeufigere Fall ist die Runde, die ein Spiel zum ersten Mal
 * spielt. Wer es kennt, drueckt "Ueberspringen" oder legt den Schalter um.
 */
const RULES_KEY = "eb.party-rules-intro";

export function getRulesIntro(): boolean {
  try {
    return localStorage.getItem(RULES_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setRulesIntro(on: boolean): void {
  try {
    localStorage.setItem(RULES_KEY, on ? "1" : "0");
  } catch {
    /* Privater Modus — dann gilt eben die Vorgabe. */
  }
  listeners.forEach((l) => l());
}

/** Stabile Funktion fuer `useSyncExternalStore` im Prerender. */
export function rulesIntroServerSnapshot(): boolean {
  return true;
}
