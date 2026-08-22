import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check, Minus, Plus, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeShares } from "@/lib/expenses-v2/types";
import type { SplitType } from "@/lib/expenses-v2/types";
import { useExpenseFormat } from "./useExpenseFormat";

/**
 * DecimalInput — phone-friendly money/percent field:
 * text input with inputMode="decimal" (iOS decimal pad instead of the symbol
 * keyboard), accepts comma AND dot, keeps a local string while focused (no
 * caret jumps from parent re-renders), and selects its value on focus so
 * typing replaces the prefilled amount immediately.
 */
export function DecimalInput({
  value,
  onCommit,
  suffix,
  className,
  ariaLabel,
}: {
  value: number;
  onCommit: (n: number) => void;
  suffix: string;
  className?: string;
  ariaLabel?: string;
}) {
  const fmt = useExpenseFormat();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const fromNumber = fmt.toInput;
  const display = focused ? text : fromNumber(value);
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={display}
        aria-label={ariaLabel}
        onFocus={(e) => {
          setFocused(true);
          setText(fromNumber(value));
          const el = e.target;
          setTimeout(() => el.select(), 0);
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.,]/g, "");
          setText(t);
          onCommit(parseFloat(t.replace(",", ".")) || 0);
        }}
        className={cn(
          "w-28 h-11 px-2 pr-7 rounded-xl bg-background border border-border text-right text-base text-foreground font-mono tabular-nums focus:outline-none focus:border-primary/50",
          className,
        )}
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
        {suffix}
      </span>
    </div>
  );
}

interface Participant {
  id: string;
  name?: string;
}

interface SplitConfiguratorProps {
  amount: number;
  currency?: string;
  participants: Participant[];
  value: Array<{ participant_id: string; amount: number }>;
  onChange: (shares: Array<{ participant_id: string; amount: number }>) => void;
  mode?: SplitType;
  onModeChange?: (mode: SplitType) => void;
  /** Weights per participant for the "shares" mode (persisted as split_meta). */
  weights?: Record<string, number>;
  onWeightsChange?: (weights: Record<string, number>) => void;
}

const MODE_ORDER: SplitType[] = ["equal", "shares", "percentage", "custom"];

/**
 * SplitConfigurator — the heart of every expense entry.
 * Three modes, per-participant exclusion via tap on avatar, live sum
 * validation. In equal mode clicking a face toggles inclusion. In
 * percentage / custom mode each person has an input; locked rows are
 * preserved when you edit another row.
 */
export function SplitConfigurator({
  amount,
  currency = "EUR",
  participants,
  value,
  onChange,
  mode = "equal",
  onModeChange,
  weights,
  onWeightsChange,
}: SplitConfiguratorProps) {
  const { t } = useTranslation();
  const fmt = useExpenseFormat(currency);
  const [localMode, setLocalMode] = useState<SplitType>(mode);
  useEffect(() => setLocalMode(mode), [mode]);

  const modes = useMemo(
    () =>
      MODE_ORDER.map((value) => ({
        value,
        label: t(`expenses.v2.split.mode.${value}.label`),
        sub: t(`expenses.v2.split.mode.${value}.hint`, { symbol: fmt.currencySymbol() }),
      })),
    [t, fmt],
  );

  // Weights for "shares" mode; default 1× each. Seeded from a passed-in map.
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    participants.forEach((p) => (w[p.id] = weights?.[p.id] ?? 1));
    return w;
  });

  const applyShares = (nextWeights: Record<string, number>) => {
    setLocalWeights(nextWeights);
    onWeightsChange?.(nextWeights);
    onChange(
      computeShares(amount, participants.map((p) => p.id), {
        type: "shares",
        shares: participants.map((p) => ({ participant_id: p.id, weight: nextWeights[p.id] ?? 0 })),
      }),
    );
  };

  const setWeight = (pid: string, next: number) => {
    applyShares({ ...localWeights, [pid]: Math.max(0, next) });
  };

  const setMode = (m: SplitType) => {
    setLocalMode(m);
    onModeChange?.(m);
    // Initialise shares for the new mode
    if (m === "equal") {
      const allIds = participants.map((p) => p.id);
      onChange(computeShares(amount, allIds, { type: "equal" }));
    } else if (m === "shares") {
      const w: Record<string, number> = {};
      participants.forEach((p) => (w[p.id] = localWeights[p.id] ?? 1));
      applyShares(w);
    } else if (m === "percentage") {
      const split = 100 / Math.max(1, participants.length);
      onChange(
        computeShares(amount, participants.map((p) => p.id), {
          type: "percentage",
          shares: participants.map((p) => ({ participant_id: p.id, percentage: split })),
        }),
      );
    } else {
      const each = Math.round((amount / Math.max(1, participants.length)) * 100) / 100;
      onChange(
        computeShares(amount, participants.map((p) => p.id), {
          type: "custom",
          shares: participants.map((p) => ({ participant_id: p.id, amount: each })),
        }),
      );
    }
  };

  // Equal mode: tap avatar to include/exclude
  const excluded = useMemo(() => {
    const included = new Set(value.map((v) => v.participant_id));
    return participants.filter((p) => !included.has(p.id)).map((p) => p.id);
  }, [participants, value]);

  const toggleExclude = (pid: string) => {
    if (localMode !== "equal") return;
    const allIds = participants.map((p) => p.id);
    const nextExcluded = excluded.includes(pid)
      ? excluded.filter((x) => x !== pid)
      : [...excluded, pid];
    onChange(computeShares(amount, allIds, { type: "equal", exclude: nextExcluded }));
  };

  // Re-compute equal/shares split if amount changes
  useEffect(() => {
    if (localMode === "equal") {
      const allIds = participants.map((p) => p.id);
      onChange(computeShares(amount, allIds, { type: "equal", exclude: excluded }));
    } else if (localMode === "shares") {
      onChange(
        computeShares(amount, participants.map((p) => p.id), {
          type: "shares",
          shares: participants.map((p) => ({ participant_id: p.id, weight: localWeights[p.id] ?? 0 })),
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, localMode]);

  // Sum validation
  const sum = value.reduce((s, x) => s + x.amount, 0);
  const delta = Math.round((amount - sum) * 100) / 100;
  const valid = Math.abs(delta) < 0.005;

  // Rows the user edited by hand — "Rest verteilen" only touches the others.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  useEffect(() => setTouched(new Set()), [localMode]);

  const markTouched = (pid: string) =>
    setTouched((s) => (s.has(pid) ? s : new Set(s).add(pid)));

  const setCustomAmount = (pid: string, nextAmount: number) => {
    markTouched(pid);
    const next = value.map((v) =>
      v.participant_id === pid ? { ...v, amount: Math.max(0, nextAmount) } : v,
    );
    onChange(next);
  };

  const setPercentage = (pid: string, pct: number) => {
    markTouched(pid);
    const clamped = Math.max(0, Math.min(100, pct));
    const updated = value.map((v) =>
      v.participant_id === pid
        ? { ...v, amount: Math.round(((amount * clamped) / 100) * 100) / 100 }
        : v,
    );
    onChange(updated);
  };

  /** Distribute the open remainder across all rows the user hasn't edited. */
  const distributeRest = () => {
    const allIds = participants.map((p) => p.id);
    const targetIds = allIds.filter((id) => !touched.has(id));
    const targets = targetIds.length > 0 ? targetIds : allIds;
    const fixedSum = value
      .filter((v) => !targets.includes(v.participant_id))
      .reduce((s, x) => s + x.amount, 0);
    const remainingCents = Math.max(0, Math.round((amount - fixedSum) * 100));
    const per = Math.floor(remainingCents / targets.length);
    let extra = remainingCents - per * targets.length;
    onChange(
      allIds.map((pid) => {
        if (!targets.includes(pid)) {
          const row = value.find((v) => v.participant_id === pid);
          return { participant_id: pid, amount: row?.amount ?? 0 };
        }
        const cents = per + (extra-- > 0 ? 1 : 0);
        return { participant_id: pid, amount: cents / 100 };
      }),
    );
  };

  return (
    <div className="space-y-3">
      {/* Mode segmented control */}
      <div className="relative grid grid-cols-4 gap-1 p-1 rounded-2xl bg-muted border border-border">
        {modes.map((m) => {
          const active = localMode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                "relative z-10 px-3 py-2 rounded-xl text-center transition-colors cursor-pointer",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.div
                  layoutId="split-mode-indicator"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-violet-500/40 -z-10"
                />
              )}
              <div className="text-xs font-semibold">{m.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Equal-mode avatar row */}
      {localMode === "equal" && (
        <div className="p-4 rounded-2xl bg-muted border border-border">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
            {t("expenses.v2.split.tapToToggle")}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {participants.map((p) => {
              const isExcluded = excluded.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleExclude(p.id)}
                  className={cn(
                    "relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm cursor-pointer transition-all",
                    isExcluded
                      ? "bg-muted border-border text-muted-foreground line-through opacity-50"
                      : "bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border-violet-400/50 text-foreground shadow-lg shadow-violet-500/10",
                  )}
                  aria-pressed={!isExcluded}
                  aria-label={
                    isExcluded
                      ? t("expenses.v2.split.includePerson", {
                          name: p.name ?? t("expenses.v2.common.person"),
                        })
                      : t("expenses.v2.split.excludePerson", {
                          name: p.name ?? t("expenses.v2.common.person"),
                        })
                  }
                >
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                  {!isExcluded && (
                    <Check className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-muted-foreground mt-3 text-center">
            {value.length > 0 ? (
              <>
                {t("expenses.v2.split.equalSummary", {
                  n: value.length,
                  total: fmt.money(amount),
                })}
                <span className="block font-semibold text-foreground">
                  {t("expenses.v2.split.perHead", { amount: fmt.money(value[0]?.amount ?? 0) })}
                </span>
              </>
            ) : (
              t("expenses.v2.split.needOnePerson")
            )}
          </div>
        </div>
      )}

      {/* Shares (weights) rows */}
      {localMode === "shares" && (
        <div className="p-4 rounded-2xl bg-muted border border-border space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
            {t("expenses.v2.split.sharesHeader")}
          </div>
          {participants.map((p) => {
            const row = value.find((v) => v.participant_id === p.id);
            const w = localWeights[p.id] ?? 0;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-sm text-foreground truncate">{p.name ?? "—"}</div>
                <div className="text-xs font-mono tabular-nums text-muted-foreground w-16 text-end">
                  {fmt.money(row?.amount ?? 0)}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWeight(p.id, w - 1)}
                    disabled={w <= 0}
                    className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground disabled:opacity-30 cursor-pointer hover:bg-white/[0.06]"
                    aria-label={t("expenses.v2.split.decreaseShare")}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums text-foreground">
                    {w}×
                  </span>
                  <button
                    type="button"
                    onClick={() => setWeight(p.id, w + 1)}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 to-cyan-500/20 border border-violet-400/40 flex items-center justify-center text-foreground cursor-pointer hover:from-violet-500/35"
                    aria-label={t("expenses.v2.split.increaseShare")}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border text-sm">
            <span className="text-muted-foreground">{t("expenses.v2.common.sum")}</span>
            <span className="font-mono tabular-nums font-semibold text-foreground">
              {fmt.money(sum)}
            </span>
          </div>
        </div>
      )}

      {/* Percentage or Custom rows */}
      {(localMode === "percentage" || localMode === "custom") && (
        <div className="p-4 rounded-2xl bg-muted border border-border space-y-2">
          {participants.map((p) => {
            const row = value.find((v) => v.participant_id === p.id);
            const rowAmount = row?.amount ?? 0;
            const percentage = amount > 0 ? Math.round((rowAmount / amount) * 10000) / 100 : 0;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-sm text-foreground truncate">{p.name ?? "—"}</div>
                {localMode === "percentage" ? (
                  <DecimalInput
                    value={percentage}
                    onCommit={(n) => setPercentage(p.id, n)}
                    suffix="%"
                    className="w-24"
                    ariaLabel={t("expenses.v2.split.percentFor", {
                      name: p.name ?? t("expenses.v2.common.person"),
                    })}
                  />
                ) : (
                  <DecimalInput
                    value={rowAmount}
                    onCommit={(n) => setCustomAmount(p.id, n)}
                    suffix={fmt.currencySymbol()}
                    ariaLabel={t("expenses.v2.split.amountFor", {
                      name: p.name ?? t("expenses.v2.common.person"),
                    })}
                  />
                )}
              </div>
            );
          })}

          {/* Sum indicator */}
          <div
            className={cn(
              "flex items-center justify-between pt-3 mt-2 border-t text-sm",
              valid ? "border-emerald-500/20" : "border-amber-500/20",
            )}
          >
            <span className="text-muted-foreground">{t("expenses.v2.common.sum")}</span>
            <span
              className={cn(
                "font-mono tabular-nums font-semibold",
                valid ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300",
              )}
            >
              {fmt.money(sum)}
              {!valid && (
                <span className="ms-2 text-xs text-amber-600 dark:text-amber-300/80">
                  ({delta > 0 ? "+" : ""}
                  {fmt.money(delta)})
                </span>
              )}
            </span>
          </div>

          {/* One-tap fill: spread the open remainder over untouched rows */}
          {localMode === "custom" && !valid && (
            <button
              type="button"
              onClick={distributeRest}
              className="mt-1 w-full h-10 rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-primary flex items-center justify-center gap-1.5 cursor-pointer active:bg-primary/10"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {t("expenses.v2.split.distributeRest", { amount: fmt.money(delta) })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
