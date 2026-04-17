// ─── Service Editor Options ──────────────────────────────────────────────────
// Shared option-lists for AgencyServiceEditor — extracted to keep the editor
// component under the 500-line budget.

export const paymentMethods = [
  {
    value: "online" as const,
    label: "Online-Zahlung (Stripe)",
    description: "Kunde zahlt sofort bei Buchung sicher über die Plattform.",
    icon: "💳",
  },
  {
    value: "on_site" as const,
    label: "Vor-Ort-Zahlung",
    description:
      "Kunde zahlt direkt bei dir. Plattformgebühr (10 %) wird trotzdem binnen 14 Tagen fällig.",
    icon: "💶",
  },
];

export type PaymentMethodValue = (typeof paymentMethods)[number]["value"];
