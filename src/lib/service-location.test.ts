import { describe, expect, it } from "vitest";
import { resolveServiceLocation, serviceMatchesLocation, sanitizeIlikeValue } from "./service-location";

const FREIBURG = { city: "Freiburg im Breisgau", country: "DE" };
const BARCELONA = { city: "Barcelona", country: "ES" };
const MADRID = { city: "Madrid", country: "ES" };

describe("resolveServiceLocation", () => {
  it("country-only destination (Spanien) never matches a German service", () => {
    const loc = resolveServiceLocation("Spanien", "Ein JGA-Wochenende voller Sonne und Tapas.");
    expect(loc).toEqual({ cities: [], country: "ES" });
    expect(serviceMatchesLocation(loc!, FREIBURG)).toBe(false);
    expect(serviceMatchesLocation(loc!, MADRID)).toBe(true);
  });

  it("narrows a country to the city the AI answer is about", () => {
    const loc = resolveServiceLocation("Spanien", "Tag 1 in Barcelona: Tapas-Tour. Abends Barcelona Beach Club.");
    expect(loc?.country).toBe("ES");
    expect(serviceMatchesLocation(loc!, BARCELONA)).toBe(true);
    expect(serviceMatchesLocation(loc!, MADRID)).toBe(false);
  });

  it("ignores cities from other countries when narrowing", () => {
    const loc = resolveServiceLocation("Spain", "Unlike Freiburg, Freiburg, Freiburg … Spain is sunny.");
    expect(loc).toEqual({ cities: [], country: "ES" });
  });

  it("handles option slugs and flag labels", () => {
    expect(resolveServiceLocation("barcelona")?.country).toBe("ES");
    expect(resolveServiceLocation("Barcelona 🇪🇸")?.country).toBe("ES");
    expect(resolveServiceLocation("Lissabon 🇵🇹")?.country).toBe("PT");
    expect(serviceMatchesLocation(resolveServiceLocation("Lisbon")!, { city: "Lisboa", country: "PT" })).toBe(true);
  });

  it("de_city / 'Großstadt in Deutschland' → Germany, narrowed by the answer", () => {
    expect(resolveServiceLocation("de_city", "")).toEqual({ cities: [], country: "DE" });
    const loc = resolveServiceLocation("Großstadt in Deutschland", "Euer Wochenende in Freiburg …");
    expect(serviceMatchesLocation(loc!, FREIBURG)).toBe(true);
    expect(serviceMatchesLocation(loc!, { city: "Berlin", country: "DE" })).toBe(false);
  });

  it("no preference + no city in answer → null (show nothing)", () => {
    expect(resolveServiceLocation("Egal – Hauptsache cool", "Ein toller Tag mit Freunden.")).toBeNull();
    expect(resolveServiceLocation("either", "")).toBeNull();
    expect(resolveServiceLocation(undefined, "Plant etwas Schönes.")).toBeNull();
  });

  it("no preference but the answer clearly names a city → that city", () => {
    const loc = resolveServiceLocation(undefined, "Wir empfehlen Prag: Bierprobe in Prag, Bootstour.");
    expect(loc?.country).toBe("CZ");
    expect(serviceMatchesLocation(loc!, FREIBURG)).toBe(false);
  });

  it("unknown custom destination matches literally", () => {
    const loc = resolveServiceLocation("Titisee-Neustadt");
    expect(loc).toEqual({ cities: ["Titisee-Neustadt"] });
    expect(serviceMatchesLocation(loc!, { city: "Titisee-Neustadt", country: "DE" })).toBe(true);
    expect(serviceMatchesLocation(loc!, FREIBURG)).toBe(false);
  });

  it("does not match city names inside other words", () => {
    expect(resolveServiceLocation(undefined, "Romantisches Dinner und Bermuda-Dreieck")).toBeNull();
  });
});

describe("sanitizeIlikeValue", () => {
  it("strips PostgREST control characters", () => {
    expect(sanitizeIlikeValue("Köln),location_city.ilike.%")).toBe("Kölnlocationcityilike");
  });
});
