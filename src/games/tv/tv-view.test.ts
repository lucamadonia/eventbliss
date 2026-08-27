/**
 * tv-view — der Ansichts-Speicher des Fernsehers.
 *
 * WARUM ES DIESEN TEST GIBT: Aufgeraeumt wurde frueher mit einem
 * 6-Sekunden-Zeitgeber in der Lobby. Wer ein einzelnes Spiel aus der Auswahl
 * startete, lief daran vorbei — der Fernseher blieb die ganze Runde ueber auf
 * der Nacht-Route. Ein Zeitgeber laesst sich nicht pruefen, ein Zustand schon.
 */
import { describe, it, expect, beforeEach } from "vitest";

import { getTvView, setTvView, resetTvView, resolveTvView, subscribeTvView } from "./tv-view";

describe("tv-view", () => {
  beforeEach(() => resetTvView());

  it("startet beim laufenden Spiel", () => {
    expect(getTvView()).toBe("ingame");
  });

  it("merkt sich die gewaehlte Ansicht", () => {
    setTvView("between");
    expect(getTvView()).toBe("between");
    setTvView("rules");
    expect(getTvView()).toBe("rules");
  });

  /**
   * Die Zusage, an der es gescheitert war: Nach dem Start eines Spiels zeigt
   * der Fernseher wieder das Spiel — egal, was vorher eingeblendet war.
   */
  it("ist nach dem Spielstart wieder beim Spiel", () => {
    setTvView("map");
    resetTvView();
    expect(getTvView()).toBe("ingame");
  });

  it("meldet jede Aenderung an die Zuhoerer", () => {
    let rufe = 0;
    const ab = subscribeTvView(() => { rufe++; });
    setTvView("finale");
    expect(rufe).toBe(1);
    // Derselbe Wert loest nichts aus — sonst sendet die Bruecke unnoetig.
    setTvView("finale");
    expect(rufe).toBe(1);
    ab();
    setTvView("intro");
    expect(rufe).toBe(1);
  });

  it("zeigt nach einem Party-Spiel automatisch den Zwischenstand", () => {
    expect(resolveTvView("ingame", { partyActive: true, gameOver: true })).toBe("between");
  });

  it("ueberschreibt weder Einzelspiele noch eine explizite Host-Ansicht", () => {
    expect(resolveTvView("ingame", { partyActive: false, gameOver: true })).toBe("ingame");
    expect(resolveTvView("finale", { partyActive: true, gameOver: true })).toBe("finale");
    expect(resolveTvView("map", { partyActive: true, gameOver: true })).toBe("map");
  });
});
