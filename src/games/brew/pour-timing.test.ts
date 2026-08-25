import { describe, it, expect } from "vitest";
import { POUR_BEATS, pourDuration, arrivalAt } from "./BrewFX";

/**
 * Die Taktzeiten sind die EINZIGE Quelle fuer drei Dinge: den Timer, der den
 * Zug weiterreicht, die Schichtverzoegerung im Glas und die Fluege selbst.
 * Laufen sie auseinander, wechselt der Zug mitten im Flug — und die Karten
 * landen sichtbar im Glas der naechsten Person.
 */
describe("pourDuration — der Guss und der Zugwechsel", () => {
  it("waechst mit der Zahl der passenden Zutaten", () => {
    const a = pourDuration(1, 0);
    const b = pourDuration(3, 0);
    const c = pourDuration(5, 0);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it("wird durch uebrige Zutaten nie kuerzer", () => {
    // Die Gesamtdauer ist das MAXIMUM beider Wege. Solange die passenden
    // Karten laenger unterwegs sind, verlaengert zusaetzlicher Ballast nichts —
    // er faellt waehrenddessen. Kuerzer werden darf es aber nie.
    for (const used of [0, 1, 3]) {
      for (let l = 0; l < 6; l++) {
        expect(pourDuration(used, l + 1), `used=${used} l=${l}`)
          .toBeGreaterThanOrEqual(pourDuration(used, l));
      }
    }
  });

  it("ohne passende Zutaten bestimmt der Ballast die Dauer", () => {
    // Reiner Fehlguss: nichts fliegt hoch, aber der Ballast muss ankommen,
    // bevor der Zug wechselt — sonst landen Karten nach dem Zugwechsel.
    expect(pourDuration(0, 5)).toBeGreaterThan(pourDuration(0, 1));
  });

  it("deckt den letzten Aufprall ab — sonst wechselt der Zug zu frueh", () => {
    for (const used of [1, 2, 3, 5, 7]) {
      const last = arrivalAt(used - 1, used) + POUR_BEATS.melt;
      expect(pourDuration(used, 0), `used=${used}`).toBeGreaterThanOrEqual(last);
    }
  });

  it("taktet ab fuenf passenden Karten enger, damit der Guss nicht zaeh wird", () => {
    // Der Sprung von 4 auf 5 darf NICHT proportional sein.
    const step4 = pourDuration(4, 0) - pourDuration(3, 0);
    const step5 = pourDuration(5, 0) - pourDuration(4, 0);
    expect(step5).toBeLessThan(step4);
  });

  it("bleibt auch im schlimmsten Fall unter zwei Sekunden", () => {
    // Rezeptlaenge 7 plus Ballast — laenger darf ein Zugwechsel nicht dauern.
    expect(pourDuration(7, 6)).toBeLessThan(2000);
  });

  it("bei Bewegungsarmut genau die Lesepause, kein Flug", () => {
    expect(pourDuration(3, 2, true)).toBe(POUR_BEATS.reducedHold);
    expect(pourDuration(7, 6, true)).toBe(POUR_BEATS.reducedHold);
  });

  it("ohne Zutaten dauert es trotzdem messbar — nichts springt", () => {
    expect(pourDuration(0, 0)).toBeGreaterThan(0);
  });
});
