/**
 * Abo-Zustaende an EINER Stelle.
 *
 * Die Tabelle `subscriptions` laesst in `plan` nur `free` und `premium` zu
 * (CHECK aus Migration 20251229122020). Die Laufzeit steht in `plan_type`,
 * "unbegrenzt" heisst `premium` ohne `expires_at`. Diese Trennung war der
 * Oberflaeche bisher nicht bekannt: der Adminbereich bot `monthly`, `yearly`
 * und `lifetime` als Plan-Werte an — drei Knoepfe, die ausnahmslos in
 * Constraint-Fehler 23514 liefen.
 *
 * Damit dieselbe Verwechslung nicht ein viertes Mal entsteht, rechnet und
 * benennt ab hier nur noch dieses Modul. Benutzer-Tab, Abo-Tab und
 * Anlege-Dialog fragen hier, statt jeweils eigene Annahmen zu treffen.
 */

/** Der einzige Nicht-Free-Wert, den die Spalte `plan` akzeptiert. */
export const PLAN_FREE = "free";
export const PLAN_PREMIUM = "premium";

/** `plan_type` fuer ein vom Adminbereich vergebenes Probe-Abo. */
export const PLAN_TYPE_TRIAL = "trial";

export const TRIAL_MONTHS_MIN = 1;
export const TRIAL_MONTHS_MAX = 60;

export function isValidTrialMonths(months: unknown): months is number {
  return (
    typeof months === "number" &&
    Number.isInteger(months) &&
    months >= TRIAL_MONTHS_MIN &&
    months <= TRIAL_MONTHS_MAX
  );
}

/**
 * Datum + n Monate, mit Monatsende-Korrektur.
 *
 * `setMonth` allein rutscht ueber den Monat hinaus: der 31. Januar plus einen
 * Monat waere sonst der 3. Maerz. Fuer ein Abo ist das falsch — der 28./29.
 * Februar ist gemeint. Deshalb wird nach dem Setzen geprueft, ob der Tag
 * uebergelaufen ist, und gegebenenfalls auf den letzten Tag des Zielmonats
 * zurueckgezogen.
 */
export function addMonths(from: Date, months: number): Date {
  const result = new Date(from.getTime());
  const targetDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  return result;
}

export interface TrialPatch {
  plan: string;
  plan_type: string;
  provider: string;
  is_manual: boolean;
  started_at: string;
  expires_at: string;
}

/**
 * Die Felder, mit denen ein Probe-Abo geschrieben wird — als ein Objekt,
 * damit Insert und Update nicht auseinanderlaufen koennen.
 */
export function buildTrialPatch(months: number, now: Date = new Date()): TrialPatch {
  if (!isValidTrialMonths(months)) {
    throw new Error(
      `Probe-Laufzeit muss zwischen ${TRIAL_MONTHS_MIN} und ${TRIAL_MONTHS_MAX} Monaten liegen.`,
    );
  }
  return {
    plan: PLAN_PREMIUM,
    plan_type: PLAN_TYPE_TRIAL,
    // `manual` unterscheidet die Zeile von Stripe- und RevenueCat-Abos, die
    // ihre eigenen Webhooks haben und nicht von Hand angefasst werden duerfen.
    provider: "manual",
    is_manual: true,
    started_at: now.toISOString(),
    expires_at: addMonths(now, months).toISOString(),
  };
}

/** Notiztext, damit spaeter nachvollziehbar ist, woher das Abo kam. */
export function trialNote(months: number, now: Date = new Date()): string {
  return `Probe ${months} ${months === 1 ? "Monat" : "Monate"} — Adminbereich, ${now.toLocaleDateString("de-DE")}`;
}

export type SubscriptionKind = "free" | "premium" | "trial" | "expired";

export interface SubscriptionLike {
  plan?: string | null;
  plan_type?: string | null;
  provider?: string | null;
  expires_at?: string | null;
}

export interface SubscriptionDescription {
  kind: SubscriptionKind;
  /** Kurzform fuer Abzeichen und Listen. */
  label: string;
  expiresAt: Date | null;
  /** Bezahlt ein Anbieter dieses Abo? Dann nicht von Hand ueberschreiben. */
  isPaid: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/**
 * Der eine Ort, der entscheidet, wie ein Abo heisst.
 *
 * Wichtig ist die Reihenfolge: ein abgelaufenes Premium ist KEIN Premium mehr.
 * Genau das hat `check-subscription` bis hierher uebersehen und jedes manuelle
 * Abo als unbefristet gemeldet.
 */
export function describeSubscription(
  sub: SubscriptionLike | null | undefined,
  now: Date = new Date(),
): SubscriptionDescription {
  const isPaid = sub?.provider === "stripe" || sub?.provider === "revenuecat";

  if (!sub || sub.plan !== PLAN_PREMIUM) {
    return { kind: "free", label: "Free", expiresAt: null, isPaid: false };
  }

  const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;

  if (!expiresAt) {
    return { kind: "premium", label: "Premium", expiresAt: null, isPaid };
  }

  if (expiresAt.getTime() <= now.getTime()) {
    return { kind: "expired", label: `Abgelaufen ${formatDate(expiresAt)}`, expiresAt, isPaid };
  }

  if (sub.plan_type === PLAN_TYPE_TRIAL) {
    return { kind: "trial", label: `Probe bis ${formatDate(expiresAt)}`, expiresAt, isPaid };
  }

  return { kind: "premium", label: `Premium bis ${formatDate(expiresAt)}`, expiresAt, isPaid };
}
