import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeShares, formatMoney } from "@/lib/expenses-v2/types";
import type { SplitType } from "@/lib/expenses-v2/types";

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
}

const MODES: Array<{ value: SplitType; label: string; sub: string }> = [
  { value: "equal", label: "Gleichmäßig", sub: "alle gleich" },
  { value: "percentage", label: "Prozent", sub: "% pro Person" },
  { value: "custom", label: "Beträge", sub: "€ pro Person" },
];

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
}: SplitConfiguratorProps) {
  const [localMode, setLocalMode] = useState<SplitType>(mode);
  useEffect(() => setLocalMode(mode), [mode]);

  const setMode = (m: SplitType) => {
    setLocalMode(m);
    onModeChange?.(m);
    // Initialise shares for the new mode
    if (m === "equal") {
      const allIds = participants.map((p) => p.id);
      onChange(computeShares(amount, allIds, { type: "equal" }));
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

  // Re-compute equal split if amount changes
  useEffect(() => {
    if (localMode === "equal") {
      const allIds = participants.map((p) => p.id);
      onChange(computeShares(amount, allIds, { type: "equal", exclude: excluded }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, localMode]);

  // Sum validation
  const sum = value.reduce((s, x) => s + x.amount, 0);
  const delta = Math.round((amount - sum) * 100) / 100;
  const valid = Math.abs(delta) < 0.005;

  const setCustomAmount = (pid: string, nextAmount: number) => {
    const next = value.map((v) =>
      v.participant_id === pid ? { ...v, amount: Math.max(0, nextAmount) } : v,
    );
    onChange(next);
  };

  const setPercentage = (pid: string, pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    const updated = value.map((v) =>
      v.participant_id === pid
        ? { ...v, amount: Math.round(((amount * clamped) / 100) * 100) / 100 }
        : v,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Mode segmented control */}
      <div className="relative grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        {MODES.map((m) => {
          const active = localMode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                "relative z-10 px-3 py-2 rounded-xl text-center transition-colors cursor-pointer",
                active ? "text-white" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {active && (
                <motion.div
                  layoutId="split-mode-indicator"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border border-violet-500/40 -z-10"
                />
              )}
              <div className="text-xs font-semibold">{m.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Equal-mode avatar row */}
      {localMode === "equal" && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
            Teilnehmer · tap um aus-/einzuschließen
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
                      ? "bg-white/[0.03] border-white/[0.08] text-slate-600 line-through opacity-50"
                      : "bg-gradient-to-br from-violet-500/30 to-cyan-500/20 border-violet-400/50 text-white shadow-lg shadow-violet-500/10",
                  )}
                  aria-pressed={!isExcluded}
                  aria-label={isExcluded ? `${p.name} einschließen` : `${p.name} ausschließen`}
                >
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                  {!isExcluded && (
                    <Check className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 mt-3 text-center">
            {value.length > 0 ? (
              <>
                {value.length}&nbsp;Personen teilen sich {formatMoney(amount, currency)} —&nbsp;
                <span className="font-semibold text-white">
                  {formatMoney(value[0]?.amount ?? 0, currency)}
                </span>
                &nbsp;pro Kopf
              </>
            ) : (
              "Mindestens eine Person muss beteiligt sein"
            )}
          </div>
        </div>
      )}

      {/* Percentage or Custom rows */}
      {(localMode === "percentage" || localMode === "custom") && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
          {participants.map((p) => {
            const row = value.find((v) => v.participant_id === p.id);
            const rowAmount = row?.amount ?? 0;
            const percentage = amount > 0 ? Math.round((rowAmount / amount) * 10000) / 100 : 0;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                  {(p.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-sm text-slate-200 truncate">{p.name ?? "—"}</div>
                {localMode === "percentage" ? (
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={percentage || ""}
                      onChange={(e) => setPercentage(p.id, parseFloat(e.target.value) || 0)}
                      className="w-20 h-10 px-2 pr-6 rounded-xl bg-white/[0.05] border border-white/[0.08] text-right text-sm text-white font-mono tabular-nums focus:outline-none focus:border-violet-400/40"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                      %
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rowAmount || ""}
                      onChange={(e) => setCustomAmount(p.id, parseFloat(e.target.value) || 0)}
                      className="w-24 h-10 px-2 pr-6 rounded-xl bg-white/[0.05] border border-white/[0.08] text-right text-sm text-white font-mono tabular-nums focus:outline-none focus:border-violet-400/40"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                      €
                    </span>
                  </div>
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
            <span className="text-slate-400">Summe</span>
            <span
              className={cn(
                "font-mono tabular-nums font-semibold",
                valid ? "text-emerald-300" : "text-amber-300",
              )}
            >
              {formatMoney(sum, currency)}
              {!valid && (
                <span className="ml-2 text-xs text-amber-300/80">
                  ({delta > 0 ? "+" : ""}
                  {formatMoney(delta, currency)})
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
