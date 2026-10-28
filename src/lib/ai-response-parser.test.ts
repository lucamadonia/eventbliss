import { describe, expect, it } from "vitest";
import { parseActivitiesExtended, parseDayPlan } from "./ai-response-parser";

describe("planning response format", () => {
  it("extracts days and timed blocks from the assistant prompt contract", () => {
    const plan = parseDayPlan(`## Freitag: Ankunft ✈️\n\n### 17:00 ✈️ Anreise\n📍 **Ort:** Bahnhof\n💰 **Kosten:** 20 €\n⏱️ **Dauer:** 1 Stunde\n📝 **Beschreibung:** Gemeinsam ankommen.\n\n---\n\n### 19:00 🍽️ Abendessen\n📝 **Beschreibung:** Zusammen essen.`);
    expect(plan.days).toHaveLength(1);
    expect(plan.days[0].timeBlocks.map((block) => block.time)).toEqual(["17:00", "19:00"]);
  });

  it("extracts numbered activities as individual suggestions", () => {
    const result = parseActivitiesExtended(`### 1. 🎯 Escape Room\n📝 **Beschreibung:** Rätsel gemeinsam lösen.\n⏱️ **Dauer:** 2 Stunden\n💰 **Kosten:** 35 € pro Person\n💪 **Fitness:** Leicht\n📍 **Ort:** Innenstadt\n🎯 **Kategorie:** Action`);
    expect(result.activities[0]?.title).toContain("Escape Room");
  });
});
