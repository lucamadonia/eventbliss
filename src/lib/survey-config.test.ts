import { describe, it, expect } from "vitest";
import {
  getEffectiveQuestionOrder,
  getDateBlocks,
  sanitizeSettingsForSave,
  validateCustomAnswers,
  mergeWithDefaults,
  CORE_QUESTION_KEYS,
  CUSTOM_ORDER_PREFIX,
  DEFAULT_SURVEY_CONFIG,
  type CustomQuestion,
  type EventSettings,
} from "./survey-config";

const settings = (): EventSettings => mergeWithDefaults(null);

describe("getEffectiveQuestionOrder", () => {
  it("returns legacy order for events without question_order", () => {
    expect(getEffectiveQuestionOrder({})).toEqual([...CORE_QUESTION_KEYS]);
  });

  it("appends custom questions in array order by default", () => {
    const order = getEffectiveQuestionOrder({
      custom_questions: [
        { id: "a", type: "text", label: "A", required: false },
        { id: "b", type: "toggle", label: "B", required: false },
      ],
    });
    expect(order).toEqual([...CORE_QUESTION_KEYS, "custom:a", "custom:b"]);
  });

  it("respects a stored order, drops unknown ids, appends missing", () => {
    const order = getEffectiveQuestionOrder({
      question_order: ["budget", "ghost", "custom:x", "attendance"],
      custom_questions: [{ id: "x", type: "text", label: "X", required: false }],
    });
    expect(order[0]).toBe("budget");
    expect(order[1]).toBe(`${CUSTOM_ORDER_PREFIX}x`);
    expect(order[2]).toBe("attendance");
    expect(order).not.toContain("ghost");
    // every known id appears exactly once
    expect(new Set(order).size).toBe(order.length);
    expect(order).toHaveLength(CORE_QUESTION_KEYS.length + 1);
  });
});

describe("getDateBlocks", () => {
  it("prefers date_ranges and reconciles against legacy keys", () => {
    const blocks = getDateBlocks({
      date_blocks: { a: "Label A", b: "Label B" },
      date_warnings: { b: "Warnung" },
      date_ranges: [
        { key: "a", start: "2026-09-11", end: "2026-09-13" },
        { key: "deleted", start: "2026-01-01", end: "2026-01-02" },
      ],
    });
    const a = blocks.find((x) => x.key === "a");
    expect(a?.start).toBe("2026-09-11");
    expect(a?.label).toBe("Label A");
    // deleted-in-legacy entry is dropped
    expect(blocks.find((x) => x.key === "deleted")).toBeUndefined();
    // legacy-only key survives with empty dates + its warning
    const b = blocks.find((x) => x.key === "b");
    expect(b?.start).toBe("");
    expect(b?.warning).toBe("Warnung");
  });
});

describe("sanitizeSettingsForSave", () => {
  it("clamps CHECK-constrained option values but keeps edited labels", () => {
    const s = settings();
    s.travel_options = [
      { value: "daytrip", label: "Nur ein Tag!", emoji: "🚗" },
      { value: "hacked_value", label: "Böse Option" },
    ];
    const out = sanitizeSettingsForSave(s);
    expect(out.travel_options.map((o) => o.value)).toEqual(
      DEFAULT_SURVEY_CONFIG.travel_options.map((o) => o.value),
    );
    expect(out.travel_options.find((o) => o.value === "daytrip")?.label).toBe("Nur ein Tag!");
    expect(out.travel_options.some((o) => o.value === "hacked_value")).toBe(false);
  });

  it("forces attendance enabled and scalar multiSelect on locked questions", () => {
    const s = settings();
    s.question_config!.attendance = { enabled: false, multiSelect: true };
    s.question_config!.fitness = { enabled: true, multiSelect: true };
    const out = sanitizeSettingsForSave(s);
    expect(out.question_config!.attendance).toEqual({ enabled: true, multiSelect: false });
    expect(out.question_config!.fitness.multiSelect).toBe(false);
  });

  it("drops unknown question_order ids and unlabeled custom questions", () => {
    const s = settings();
    s.custom_questions = [
      { id: "keep", type: "text", label: "Bleibt", required: false },
      { id: "drop", type: "text", label: "   ", required: false },
    ];
    s.question_order = ["budget", "custom:keep", "custom:drop", "nonsense"];
    const out = sanitizeSettingsForSave(s);
    expect(out.custom_questions!.map((q) => q.id)).toEqual(["keep"]);
    expect(out.question_order).toEqual(["budget", "custom:keep"]);
  });
});

describe("validateCustomAnswers", () => {
  const questions: CustomQuestion[] = [
    { id: "req_text", type: "text", label: "Pflichttext", required: true },
    { id: "opt_text", type: "text", label: "Optional", required: false },
    { id: "stars", type: "rating", label: "Bewertung", required: false },
    { id: "amount", type: "number", label: "Anzahl", required: false, min: 1, max: 10 },
    { id: "coming", type: "toggle", label: "Toggle", required: true },
  ];

  it("rejects when a required question is unanswered and names it", () => {
    const res = validateCustomAnswers(questions, { coming: false });
    expect(res.ok).toBe(false);
    expect(res.firstMissingLabel).toBe("Pflichttext");
  });

  it("accepts toggles in their off state as answered", () => {
    const res = validateCustomAnswers(questions, { req_text: "hi", coming: false });
    expect(res.ok).toBe(true);
  });

  it("clamps rating and number into bounds", () => {
    const res = validateCustomAnswers(questions, {
      req_text: "x",
      coming: true,
      stars: "9",
      amount: "999",
    });
    expect(res.ok).toBe(true);
    expect(res.sanitized.stars).toBe("5");
    expect(res.sanitized.amount).toBe("10");
  });
});
