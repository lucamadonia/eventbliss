import { describe, expect, it } from "vitest";
import { parseActivitiesExtended, parseDayPlan } from "./ai-response-parser";

describe("planning response format", () => {
  it("parses numbered day sections with a calendar icon and bold time blocks", () => {
    const plan = parseDayPlan(`### 📅 Tag 1: Ankunft\n**09:00** Frühstück\n- **Experience:** Gemeinsam starten.\n**13:00** Stadtrundgang\n- **Experience:** Die Stadt entdecken.\n### 📅 Tag 2: Rückreise\n**10:00** Brunch\n**15:00** Heimfahrt`);
    expect(plan.days).toHaveLength(2);
    expect(plan.days.map((day) => day.timeBlocks.length)).toEqual([2, 2]);
  });

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
