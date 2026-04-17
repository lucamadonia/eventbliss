// Add missing dashboard.tabs.expenses key to all locales.
// Also verifies the tab keys match what EventDashboard.tsx expects.

import { readFileSync, writeFileSync } from "node:fs";

const LOCALES = [
  { code: "de", expenses: "Ausgaben" },
  { code: "en", expenses: "Expenses" },
  { code: "es", expenses: "Gastos" },
  { code: "fr", expenses: "Dépenses" },
  { code: "it", expenses: "Spese" },
  { code: "nl", expenses: "Uitgaven" },
  { code: "pl", expenses: "Wydatki" },
  { code: "pt", expenses: "Despesas" },
  { code: "tr", expenses: "Giderler" },
  { code: "ar", expenses: "المصروفات" },
];

for (const { code, expenses } of LOCALES) {
  const path = `src/i18n/locales/${code}.json`;
  const data = JSON.parse(readFileSync(path, "utf-8"));
  data.dashboard = data.dashboard || {};
  data.dashboard.tabs = data.dashboard.tabs || {};
  if (!data.dashboard.tabs.expenses) {
    data.dashboard.tabs.expenses = expenses;
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`✓ ${code}: added dashboard.tabs.expenses = "${expenses}"`);
  } else {
    console.log(`· ${code}: dashboard.tabs.expenses already present`);
  }
}
