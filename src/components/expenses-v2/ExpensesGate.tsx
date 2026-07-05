/**
 * ExpensesGate — single branch point for the expenses experience.
 *
 * v2 is the default; the `expenses_v2_off` kill-switch flag falls back to the
 * legacy v1 page. There is deliberately NO loading gate: while the flag query
 * is in flight, `off` is false → v2 renders immediately (no v1 flash, no
 * spinner). Used by both the web router (App.tsx) and the native shell
 * (NativeApp.tsx) so the two stay in sync.
 */
import { lazy } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

const EventExpenses = lazy(() => import("@/pages/EventExpenses"));
const EventExpensesV2 = lazy(() => import("@/pages/EventExpensesV2"));

export function ExpensesGate() {
  const { enabled: off } = useFeatureFlag("expenses_v2_off");
  return off ? <EventExpenses /> : <EventExpensesV2 />;
}

export default ExpensesGate;
