import { describe, it, expect } from "vitest";
import {
  BRIEFING_FIELDS,
  EMPTY_BRIEFING,
  PORTAL_FIELDS,
  briefingForPortal,
  fromTemplate,
  hasBriefingContent,
  toLines,
  toList,
} from "./influencer-briefing";

describe("Standardwerte", () => {
  it("verlangt Kennzeichnung von sich aus", () => {
    // Verguetete Beitraege sind kennzeichnungspflichtig. Eine Voreinstellung,
    // die das vergisst, produziert Verstoesse beim Influencer.
    expect(EMPTY_BRIEFING.disclosure_required).toBe(true);
    expect(EMPTY_BRIEFING.disclosure_text).toBeTruthy();
  });

  it("verlangt keine Freigabe von sich aus", () => {
    expect(EMPTY_BRIEFING.approval_required).toBe(false);
  });
});

describe("fromTemplate", () => {
  it("ergibt ohne Vorlage ein vollstaendiges leeres Briefing", () => {
    const b = fromTemplate(null);
    expect(Object.keys(b).sort()).toEqual([...BRIEFING_FIELDS].sort());
  });

  it("uebernimmt gesetzte Felder", () => {
    const b = fromTemplate({ headline: "Sommerkampagne", hashtags: ["#jga"] });
    expect(b.headline).toBe("Sommerkampagne");
    expect(b.hashtags).toEqual(["#jga"]);
  });

  it("faellt bei fehlenden Feldern auf den Standard zurueck statt auf undefined", () => {
    const b = fromTemplate({ headline: "Nur die Zeile" });
    expect(b.disclosure_required).toBe(true);
    expect(b.dos).toEqual([]);
    expect(b.publish_from).toBeNull();
  });

  it("kopiert, statt zu verweisen", () => {
    // Sonst aendert eine spaetere Vorlagenaenderung rueckwirkend das, was
    // jemand laengst zugesagt bekommen hat.
    const template = { dos: ["Zeig die App"] };
    const b = fromTemplate(template);
    b.dos.push("Noch etwas");
    expect(template.dos).toEqual(["Zeig die App"]);
  });
});

describe("briefingForPortal", () => {
  const full = {
    ...EMPTY_BRIEFING,
    headline: "Sommerkampagne",
    core_message: "Zeig, wie ihr euren JGA plant.",
    internal_notes: "Vorsicht, war beim ersten Kontakt genervt.",
  };

  it("gibt niemals interne Vermerke heraus", () => {
    const p = briefingForPortal(full) as Record<string, unknown>;
    expect(p.internal_notes).toBeUndefined();
    expect(JSON.stringify(p)).not.toContain("genervt");
  });

  it("arbeitet mit einer Positivliste — jedes neue Feld ist erst einmal intern", () => {
    const p = briefingForPortal({ ...full, geheim: "nicht zeigen" } as never) as Record<string, unknown>;
    expect(p.geheim).toBeUndefined();
    expect(Object.keys(p).sort()).toEqual([...PORTAL_FIELDS].sort());
  });

  it("reicht die sichtbaren Inhalte durch", () => {
    const p = briefingForPortal(full);
    expect(p?.headline).toBe("Sommerkampagne");
    expect(p?.disclosure_required).toBe(true);
  });

  it("ergibt ohne Briefing null", () => {
    expect(briefingForPortal(null)).toBeNull();
  });
});

describe("hasBriefingContent", () => {
  it("erkennt ein leeres Briefing", () => {
    expect(hasBriefingContent(EMPTY_BRIEFING)).toBe(false);
    expect(hasBriefingContent(null)).toBe(false);
  });

  it("erkennt Inhalt an jedem der tragenden Felder", () => {
    expect(hasBriefingContent({ ...EMPTY_BRIEFING, headline: "X" })).toBe(true);
    expect(hasBriefingContent({ ...EMPTY_BRIEFING, dos: ["X"] })).toBe(true);
    expect(hasBriefingContent({ ...EMPTY_BRIEFING, discount_code: "JGA10" })).toBe(true);
  });

  it("zaehlt die Voreinstellungen nicht als Inhalt", () => {
    // mention_handles und link_url sind vorbelegt — sonst gaelte jedes frische
    // Briefing als ausgefuellt.
    expect(hasBriefingContent({ ...EMPTY_BRIEFING, mention_handles: ["@eventbliss"] })).toBe(false);
  });
});

describe("Eingabehilfen", () => {
  it("toList trennt an Kommas und wirft Leeres weg", () => {
    expect(toList("#jga, #party ,, #hamburg")).toEqual(["#jga", "#party", "#hamburg"]);
    expect(toList("")).toEqual([]);
  });

  it("toLines trennt an Zeilenumbruechen", () => {
    expect(toLines("Zeig die App\r\n\nNenne den Code")).toEqual(["Zeig die App", "Nenne den Code"]);
  });
});
