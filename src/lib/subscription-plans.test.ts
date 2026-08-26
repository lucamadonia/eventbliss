import { describe, it, expect } from "vitest";
import {
  addMonths,
  buildTrialPatch,
  describeSubscription,
  isValidTrialMonths,
  trialNote,
  TRIAL_MONTHS_MAX,
} from "./subscription-plans";

describe("addMonths", () => {
  it("rechnet im Normalfall schlicht Monate dazu", () => {
    expect(addMonths(new Date("2026-08-26T10:00:00Z"), 3).toISOString().slice(0, 10)).toBe("2026-11-26");
  });

  it("zieht auf den letzten Tag zurueck, statt in den Folgemonat zu rutschen", () => {
    // Der Fall, der `setMonth` allein zerreisst: 31.01. + 1 Monat waere sonst
    // der 3. Maerz. Fuer ein Abo ist der 28. Februar gemeint.
    const result = addMonths(new Date(2026, 0, 31, 12), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });

  it("kennt den Schalttag", () => {
    const result = addMonths(new Date(2028, 0, 31, 12), 1);
    expect(result.getDate()).toBe(29);
  });

  it("laeuft ueber den Jahreswechsel", () => {
    const result = addMonths(new Date(2026, 10, 15, 12), 3);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(1);
  });

  it("laesst die Uhrzeit unberuehrt", () => {
    const from = new Date(2026, 5, 10, 14, 37, 5);
    expect(addMonths(from, 6).getHours()).toBe(14);
  });
});

describe("isValidTrialMonths", () => {
  it("nimmt ganze Zahlen im erlaubten Bereich", () => {
    expect(isValidTrialMonths(1)).toBe(true);
    expect(isValidTrialMonths(12)).toBe(true);
    expect(isValidTrialMonths(TRIAL_MONTHS_MAX)).toBe(true);
  });

  it("weist alles andere ab", () => {
    expect(isValidTrialMonths(0)).toBe(false);
    expect(isValidTrialMonths(-3)).toBe(false);
    expect(isValidTrialMonths(1.5)).toBe(false);
    expect(isValidTrialMonths(TRIAL_MONTHS_MAX + 1)).toBe(false);
    expect(isValidTrialMonths("3")).toBe(false);
    expect(isValidTrialMonths(null)).toBe(false);
    expect(isValidTrialMonths(NaN)).toBe(false);
  });
});

describe("buildTrialPatch", () => {
  const now = new Date("2026-08-26T10:00:00Z");

  it("schreibt einen Plan-Wert, den die Tabelle akzeptiert", () => {
    // Der ganze Grund dieses Moduls: `plan` darf nur free/premium sein.
    expect(buildTrialPatch(3, now).plan).toBe("premium");
  });

  it("markiert die Laufzeit in plan_type statt in plan", () => {
    const patch = buildTrialPatch(3, now);
    expect(patch.plan_type).toBe("trial");
    expect(patch.provider).toBe("manual");
    expect(patch.is_manual).toBe(true);
  });

  it("setzt das Ablaufdatum auf heute plus Laufzeit", () => {
    expect(buildTrialPatch(6, now).expires_at.slice(0, 10)).toBe("2027-02-26");
  });

  it("verweigert unmoegliche Laufzeiten", () => {
    expect(() => buildTrialPatch(0, now)).toThrow();
    expect(() => buildTrialPatch(999, now)).toThrow();
  });
});

describe("trialNote", () => {
  it("beugt den Monat", () => {
    const now = new Date(2026, 7, 26);
    expect(trialNote(1, now)).toContain("1 Monat —");
    expect(trialNote(3, now)).toContain("3 Monate");
  });
});

describe("describeSubscription", () => {
  const now = new Date("2026-08-26T10:00:00Z");

  it("nennt fehlende und freie Abos Free", () => {
    expect(describeSubscription(null, now).kind).toBe("free");
    expect(describeSubscription({ plan: "free" }, now).kind).toBe("free");
  });

  it("nennt Premium ohne Ablauf schlicht Premium", () => {
    const d = describeSubscription({ plan: "premium", expires_at: null }, now);
    expect(d.kind).toBe("premium");
    expect(d.label).toBe("Premium");
  });

  it("weist ein Probe-Abo mit Datum aus", () => {
    const d = describeSubscription(
      { plan: "premium", plan_type: "trial", expires_at: "2026-11-26T10:00:00Z" },
      now,
    );
    expect(d.kind).toBe("trial");
    expect(d.label).toBe("Probe bis 26.11.26");
  });

  it("behandelt ein abgelaufenes Premium NICHT mehr als Premium", () => {
    // Genau der Fehler in check-subscription: abgelaufen blieb premium.
    const d = describeSubscription(
      { plan: "premium", plan_type: "trial", expires_at: "2026-08-01T10:00:00Z" },
      now,
    );
    expect(d.kind).toBe("expired");
  });

  it("erkennt bezahlte Abos, damit sie nicht ueberschrieben werden", () => {
    expect(describeSubscription({ plan: "premium", provider: "stripe" }, now).isPaid).toBe(true);
    expect(describeSubscription({ plan: "premium", provider: "revenuecat" }, now).isPaid).toBe(true);
    expect(describeSubscription({ plan: "premium", provider: "manual" }, now).isPaid).toBe(false);
  });

  it("zeigt ein befristetes Nicht-Probe-Abo mit Enddatum", () => {
    const d = describeSubscription(
      { plan: "premium", plan_type: "monthly", expires_at: "2026-09-26T10:00:00Z" },
      now,
    );
    expect(d.kind).toBe("premium");
    expect(d.label).toBe("Premium bis 26.09.26");
  });
});
