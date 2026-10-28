/**
 * PayerSelector — who paid. Single payer by default (one tap = full amount);
 * a "Mehrere" toggle switches to multi-payer with per-person amount inputs and
 * live sum validation. Always emits PayerConfig[] summing to the total.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PayerConfig } from "@/lib/expenses-v2/types";
import { DecimalInput } from "./SplitConfigurator";
import { useExpenseFormat } from "./useExpenseFormat";

interface Participant {
  id: string;
  name?: string;
}

interface PayerSelectorProps {
  participants: Participant[];
  amount: number;
  currency?: string;
  value: PayerConfig[];
  onChange: (payers: PayerConfig[]) => void;
  multi: boolean;
  onMultiChange: (multi: boolean) => void;
}

export function PayerSelector({
  participants,
  amount,
  currency = "EUR",
  value,
  onChange,
  multi,
  onMultiChange,
}: PayerSelectorProps) {
  const { t } = useTranslation();
  const fmt = useExpenseFormat(currency);
  const sum = useMemo(() => value.reduce((s, p) => s + p.amount, 0), [value]);
  const delta = Math.round((amount - sum) * 100) / 100;

  const selectSingle = (pid: string) => onChange([{ participant_id: pid, amount }]);

  const enableMulti = () => {
    onMultiChange(true);
    // Seed from the current single payer (or everyone) split equally.
    const seeded = value.length ? value.map((p) => p.participant_id) : participants.map((p) => p.id);
    const each = Math.round((amount / Math.max(1, seeded.length)) * 100) / 100;
    onChange(seeded.map((id) => ({ participant_id: id, amount: each })));
  };

  const disableMulti = () => {
    onMultiChange(false);
    const first = value[0]?.participant_id ?? participants[0]?.id;
    if (first) onChange([{ participant_id: first, amount }]);
  };

  const togglePayer = (pid: string) => {
    const exists = value.some((p) => p.participant_id === pid);
    const next = exists
      ? value.filter((p) => p.participant_id !== pid)
      : [...value, { participant_id: pid, amount: 0 }];
    // Re-split equally among the selected payers.
    const each = Math.round((amount / Math.max(1, next.length)) * 100) / 100;
    onChange(next.map((p) => ({ ...p, amount: each })));
  };

  const setPayerAmount = (pid: string, amt: number) =>
    onChange(value.map((p) => (p.participant_id === pid ? { ...p, amount: Math.max(0, amt) } : p)));

  if (!multi) {
    const activeId = value[0]?.participant_id;
    return (
      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("expenses.paidBy")}
          </div>
          <button
            type="button"
            onClick={enableMulti}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-400/30 px-3 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-500/10 dark:text-violet-300"
          >
            <Users className="h-4 w-4" /> {t("expenses.v2.payer.multiple")}
          </button>
        </div>
        <div className={cn("grid gap-3", participants.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
          {participants.map((p) => {
            const active = activeId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectSingle(p.id)}
                className={cn(
                  "relative flex min-h-28 w-full flex-col items-start justify-between gap-3 rounded-3xl border p-4 text-left text-sm font-semibold transition-all active:scale-[0.98]",
                  active
                    ? "border-violet-400/70 bg-gradient-to-br from-violet-500/25 to-cyan-500/15 text-foreground shadow-[0_12px_28px_-20px_rgba(139,92,246,0.9)] ring-1 ring-violet-400/30"
                    : "border-border bg-muted/70 text-foreground hover:border-violet-400/40 hover:bg-muted",
                )}
                aria-pressed={active}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold",
                    active ? "bg-violet-500/25 text-violet-700 dark:text-violet-100" : "bg-background text-muted-foreground",
                  )}
                >
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <span className="w-full break-words leading-tight">{p.name}</span>
                {active && <Check className="absolute right-4 top-4 h-5 w-5 text-violet-600 dark:text-violet-200" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Multi-payer
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {t("expenses.v2.payer.multiTitle")}
        </div>
        <button
          type="button"
          onClick={disableMulti}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
        >
          <User className="w-3.5 h-3.5" /> {t("expenses.v2.payer.single")}
        </button>
      </div>
      <div className="p-3 rounded-2xl bg-muted border border-border space-y-2">
        {participants.map((p) => {
          const row = value.find((v) => v.participant_id === p.id);
          const selected = !!row;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => togglePayer(p.id)}
                className={cn(
                  "w-9 h-9 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 cursor-pointer transition-colors",
                  selected
                    ? "bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border-violet-400/50 text-foreground"
                    : "bg-muted border-border text-muted-foreground",
                )}
                aria-pressed={selected}
              >
                {(p.name ?? "?").slice(0, 1).toUpperCase()}
              </button>
              <div className="flex-1 min-w-0 text-sm text-foreground truncate">{p.name ?? "—"}</div>
              {selected && (
                <DecimalInput
                  value={row?.amount ?? 0}
                  onCommit={(n) => setPayerAmount(p.id, n)}
                  suffix={fmt.currencySymbol()}
                  ariaLabel={t("expenses.v2.payer.paidByPerson", {
                    name: p.name ?? t("expenses.v2.common.person"),
                  })}
                />
              )}
            </div>
          );
        })}
        <div
          className={cn(
            "flex items-center justify-between pt-3 mt-1 border-t text-sm",
            Math.abs(delta) < 0.005 ? "border-emerald-500/20" : "border-amber-500/20",
          )}
        >
          <span className="text-muted-foreground">{t("expenses.v2.common.sum")}</span>
          <span
            className={cn(
              "font-mono tabular-nums font-semibold",
              Math.abs(delta) < 0.005
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-amber-600 dark:text-amber-300",
            )}
          >
            {fmt.money(sum)}
            {Math.abs(delta) >= 0.005 && (
              <span className="ms-2 text-xs">
                ({delta > 0 ? "+" : ""}
                {fmt.money(delta)})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
