import { describe, expect, it } from "vitest";
import { dayPlanTokenBudget, isCompleteDayPlan } from "../../supabase/functions/ai-assistant/day-plan-completion";

describe("day plan completeness", () => {
  it("gives longer plans enough output capacity", () => {
    expect(dayPlanTokenBudget(5)).toBeGreaterThan(dayPlanTokenBudget(3));
    expect(dayPlanTokenBudget(14)).toBe(16_000);
  });

  it("rejects the truncated five-day response before a credit is charged", () => {
    const partial = "### 📅 Tag 1: Start\nText\n### 📅 Tag 2: Ausflug\nText\n### 📅 Tag 3: Mehr";
    expect(isCompleteDayPlan(partial, 5, "length")).toBe(false);
    expect(isCompleteDayPlan(partial, 5, "stop")).toBe(false);
  });

  it("accepts all requested days in the expected heading format", () => {
    const full = Array.from({ length: 5 }, (_, i) => `### 📅 Tag ${i + 1}: Etappe\n**09:00** Frühstück\n- Gemeinsam starten.\n**13:00** Ausflug\n- Gemeinsam entdecken.`).join("\n");
    expect(isCompleteDayPlan(full, 5, "stop")).toBe(true);
  });

  it("rejects a day that has only a heading and one activity", () => {
    const partial = `### 📅 Tag 1: Start\n**09:00** Frühstück\n**13:00** Ausflug\n### 📅 Tag 2: Ende\n**09:00** Heimreise`;
    expect(isCompleteDayPlan(partial, 2, "stop")).toBe(false);
  });
});
