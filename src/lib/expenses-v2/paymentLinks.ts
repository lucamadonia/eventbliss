// Settlement deep-link / copy-to-clipboard helpers. Kept in its own
// module so we can unit-test the URL shapes without mounting React.
//
// Contract: each method either returns a *launchable* string
// (http/s URL or native URL scheme) — in which case the SettlementFlow
// will `window.open` it — or a `{ copy: string }` object, in which
// case the flow copies the value to the clipboard and shows a toast.

import type { SettlementMethod } from "./types";

export interface SettlementTarget {
  name?: string;
  paypal_me?: string;
  revolut_tag?: string;
  iban?: string;
  bic?: string;
  twint_number?: string; // CH mobile like +41791234567
}

export type SettlementAction =
  | { kind: "open"; url: string }
  | { kind: "copy"; value: string; hint: string }
  | null;

function encodeNote(note?: string): string {
  if (!note) return "";
  return encodeURIComponent(note).slice(0, 120);
}

export function buildSettlementAction(
  method: SettlementMethod,
  target: SettlementTarget,
  amount: number,
  note?: string,
): SettlementAction {
  const formatted = amount.toFixed(2);

  switch (method) {
    case "paypal": {
      if (!target.paypal_me) return null;
      // paypal.me doesn't accept a note parameter, but the amount
      // pre-fills the next screen and the user can add a memo there.
      return { kind: "open", url: `https://paypal.me/${encodeURIComponent(target.paypal_me)}/${formatted}EUR` };
    }
    case "revolut": {
      if (!target.revolut_tag) return null;
      // revolut.me supports ?amount=X and ?currency=EUR
      return {
        kind: "open",
        url: `https://revolut.me/${encodeURIComponent(target.revolut_tag)}?amount=${formatted}&currency=EUR`,
      };
    }
    case "wise": {
      // Wise doesn't expose a public paylink scheme — but a pre-filled
      // transfer URL works when the user is signed in.
      return {
        kind: "open",
        url: `https://wise.com/pay/me/${encodeURIComponent(target.name ?? "")}?amount=${formatted}&currency=EUR`,
      };
    }
    case "bank": {
      if (!target.iban) return null;
      // `bank://` is not a registered scheme — IBAN copy is the most
      // reliable cross-platform fallback. Callers show a toast with
      // the hint so the user knows what to do next.
      const parts = [target.iban];
      if (target.bic) parts.push(`BIC ${target.bic}`);
      parts.push(`${formatted} €`);
      if (note) parts.push(`Verwendungszweck: ${note}`);
      return {
        kind: "copy",
        value: parts.join(" · "),
        hint: "IBAN + Betrag kopiert — öffne deine Banking-App zum Einfügen.",
      };
    }
    case "apple_pay":
    case "google_pay": {
      // Neither supports a person-to-person deep-link on arbitrary
      // recipients. User has to open their wallet app manually.
      return null;
    }
    case "cash":
    case "other":
      return null;
  }
}

/**
 * Narrow type-guard to check whether a method *could* produce a
 * launchable link for the given target — used to render the
 * green "LINK" badge in the SettlementFlow method picker.
 */
export function hasDeepLink(
  method: SettlementMethod,
  target: SettlementTarget,
  amount: number,
): boolean {
  const action = buildSettlementAction(method, target, amount);
  return action?.kind === "open";
}
