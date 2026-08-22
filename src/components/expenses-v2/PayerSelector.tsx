/**
 * PayerSelector — who paid. Single payer by default (one tap = full amount);
 * a "Mehrere" toggle switches to multi-payer with per-person amount inputs and
 * live sum validation. Always emits PayerConfig[] summing to the total.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users, User } from "lucide-react";
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
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {t("expenses.paidBy")}
          </div>
          <button
            type="button"
            onClick={enableMulti}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-300 cursor-pointer hover:opacity-80"
          >
            <Users className="w-3.5 h-3.5" /> {t("expenses.v2.payer.multiple")}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {participants.map((p) => {
            const active = activeId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectSingle(p.id)}
                className={cn(
                  "flex-shrink-0 h-11 px-4 rounded-full border text-sm font-medium cursor-pointer transition-colors flex items-center gap-2",
                  active
                    ? "bg-gradient-to-r from-violet-500/25 to-cyan-500/25 border-violet-400/50 text-foreground"
                    : "bg-muted border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center",
                    active ? "bg-foreground/15" : "bg-muted",
                  )}
                >
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                {p.name}
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
