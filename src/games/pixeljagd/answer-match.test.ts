import { describe, it, expect } from "vitest";
import { normalizeAnswer, isCorrectAnswer } from "./answer-match";
import { stepsFor, pointsAt, FINAL_STEP } from "./pixelate";

describe("normalizeAnswer", () => {
  it("faltet Groß-/Kleinschreibung und Rand-Leerzeichen", () => {
    expect(normalizeAnswer("  LÖWE ")).toBe(normalizeAnswer("löwe"));
  });

  it("behandelt Umlaut und Ersatzschreibweise gleich", () => {
    expect(normalizeAnswer("Löwe")).toBe(normalizeAnswer("Loewe"));
    expect(normalizeAnswer("Müsli")).toBe(normalizeAnswer("Muesli"));
    expect(normalizeAnswer("Straße")).toBe(normalizeAnswer("Strasse"));
  });

  it("entfernt führende Artikel und Interpunktion", () => {
    expect(normalizeAnswer("Der Löwe!")).toBe(normalizeAnswer("Löwe"));
    expect(normalizeAnswer("The Lion")).toBe(normalizeAnswer("Lion"));
  });

  it("zieht Mehrfachleerzeichen zusammen", () => {
    expect(normalizeAnswer("Eiffel   turm")).toBe("eiffel turm");
  });
});

describe("isCorrectAnswer", () => {
  it("akzeptiert die exakte Antwort", () => {
    expect(isCorrectAnswer("Löwe", "Löwe")).toBe(true);
  });

  it("akzeptiert Schreibvarianten und Artikel", () => {
    expect(isCorrectAnswer("loewe", "Löwe")).toBe(true);
    expect(isCorrectAnswer("der Löwe", "Löwe")).toBe(true);
    expect(isCorrectAnswer("LÖWE ", "Löwe")).toBe(true);
  });

  it("akzeptiert Aliase", () => {
    expect(isCorrectAnswer("Lion", "Löwe", ["Lion", "Panthera leo"])).toBe(true);
  });

  it("verzeiht einen Tippfehler bei längeren Begriffen", () => {
    expect(isCorrectAnswer("Eiffelturn", "Eiffelturm")).toBe(true);
  });

  it("lehnt einen anderen Begriff ab", () => {
    expect(isCorrectAnswer("Tiger", "Löwe")).toBe(false);
    expect(isCorrectAnswer("Katze", "Löwe")).toBe(false);
  });

  it("ist bei kurzen Begriffen streng — sonst gewinnt man mit Raten", () => {
    // 3 Zeichen, ein Buchstabe Unterschied: darf NICHT durchgehen.
    expect(isCorrectAnswer("Ufo", "Uhu")).toBe(false);
  });

  it("lehnt Leereingaben ab", () => {
    expect(isCorrectAnswer("", "Löwe")).toBe(false);
    expect(isCorrectAnswer("   ", "Löwe")).toBe(false);
  });
});

describe("stepsFor", () => {
  it("liefert eine Stufe pro Sekunde", () => {
    expect(stepsFor(8, 30)).toHaveLength(30);
    expect(stepsFor(10, 15)).toHaveLength(15);
  });

  it("startet grob und endet scharf", () => {
    const s = stepsFor(8, 30);
    expect(s[0]).toBe(8);
    expect(s[s.length - 1]).toBe(FINAL_STEP);
  });

  it("wächst monoton", () => {
    const s = stepsFor(8, 30);
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThanOrEqual(s[i - 1]);
  });

  it("wächst geometrisch: der RELATIVE Sprung bleibt konstant", () => {
    // Genau das ist der Punkt gegenüber einer linearen Leiter — sonst passierte
    // die eigentliche Erkennung geballt in den letzten Sekunden.
    const s = stepsFor(8, 30);
    expect(s[1] / s[0]).toBeCloseTo(s[s.length - 1] / s[s.length - 2], 1);
    expect(s[s.length - 1] - s[s.length - 2]).toBeGreaterThan(s[1] - s[0]);
  });
});

describe("pointsAt", () => {
  it("startet bei 100 und endet bei 10", () => {
    expect(pointsAt(0, 30)).toBe(100);
    expect(pointsAt(30, 30)).toBe(10);
  });

  it("fällt monoton", () => {
    let prev = 101;
    for (let s = 0; s <= 30; s++) {
      const p = pointsAt(s, 30);
      expect(p).toBeLessThanOrEqual(prev);
      prev = p;
    }
  });

  it("fällt nie unter 10, auch bei Überzeit", () => {
    expect(pointsAt(999, 30)).toBe(10);
  });
});
