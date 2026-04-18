import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, TrendingDown, CheckCircle2, Wallet, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/expenses-v2/types";
import type { ParticipantBalance } from "@/lib/expenses-v2/types";
import { CountUp } from "./CountUp";

interface Participant {
  id: string;
  name?: string;
  avatar_url?: string | null;
}

interface BalanceCardProps {
  balances: ParticipantBalance[];
  participants: Participant[];
  currentParticipantId?: string;
  currency?: string;
  expanded?: boolean;
  onToggle?: () => void;
}

/**
 * BalanceCard — the hero moment of the expenses module.
 * - Count-up animated money value
 * - Tone-tinted gradient backdrop (emerald / rose / slate)
 * - Inner glow that pulses subtly when there's something owed
 * - "All settled" state breathes gently
 * - Expandable per-member breakdown with animated bars
 * - Dark-only, tabular-num money, thumb-reachable
 */
export function BalanceCard({
  balances,
  participants,
  currentParticipantId,
  currency = "EUR",
  expanded = false,
  onToggle,
}: BalanceCardProps) {
  const reduced = useReducedMotion();
  const byId = new Map(balances.map((b) => [b.participant_id, b.net_balance]));
  const me = currentParticipantId ? byId.get(currentParticipantId) ?? 0 : 0;
  const allSettled = balances.every((b) => Math.abs(b.net_balance) < 0.005);

  const toneKey = allSettled ? "settled" : me > 0.005 ? "up" : me < -0.005 ? "down" : "idle";
  const toneClass = {
    up: {
      border: "border-emerald-500/25",
      bg: "bg-gradient-to-br from-emerald-500/[0.10] via-[#14171F] to-[#14171F]",
      accent: "text-emerald-300",
      chip: "bg-emerald-500/15 text-emerald-300",
      glow: "bg-emerald-500/15",
    },
    down: {
      border: "border-rose-500/25",
      bg: "bg-gradient-to-br from-rose-500/[0.10] via-[#14171F] to-[#14171F]",
      accent: "text-rose-300",
      chip: "bg-rose-500/15 text-rose-300",
      glow: "bg-rose-500/15",
    },
    settled: {
      border: "border-emerald-500/20",
      bg: "bg-gradient-to-br from-emerald-500/[0.06] via-[#14171F] to-[#14171F]",
      accent: "text-emerald-200",
      chip: "bg-emerald-500/10 text-emerald-300",
      glow: "bg-emerald-500/10",
    },
    idle: {
      border: "border-white/[0.08]",
      bg: "bg-[#14171F]",
      accent: "text-slate-100",
      chip: "bg-white/[0.06] text-slate-300",
      glow: "bg-white/[0.04]",
    },
  }[toneKey];

  const Icon = allSettled ? CheckCircle2 : me > 0 ? TrendingUp : me < 0 ? TrendingDown : Wallet;
  const label = allSettled
    ? "Alles beglichen"
    : me > 0
    ? "Dir wird geschuldet"
    : me < 0
    ? "Du schuldest"
    : "Noch offen";

  const maxAbs = Math.max(...balances.map((b) => Math.abs(b.net_balance)), 1);

  return (
    <motion.div
      layout
      className={cn(
        "relative w-full rounded-3xl border overflow-hidden backdrop-blur-xl",
        toneClass.bg,
        toneClass.border,
      )}
      whileTap={onToggle ? { scale: 0.99 } : undefined}
      onClick={onToggle}
      role={onToggle ? "button" : undefined}
      aria-expanded={expanded}
      aria-label="Balance-Übersicht"
    >
      {/* Ambient glow behind amount */}
      <motion.div
        aria-hidden
        className={cn("absolute -top-1/2 left-1/4 w-96 h-96 rounded-full blur-3xl", toneClass.glow)}
        animate={reduced ? undefined : allSettled ? { opacity: [0.3, 0.5, 0.3] } : { opacity: [0.5, 0.7, 0.5], scale: [1, 1.05, 1] }}
        transition={{ duration: allSettled ? 6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Top row — status chip */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", toneClass.chip)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-slate-400">
              {label}
            </span>
          </div>
          {onToggle && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </motion.div>
          )}
        </div>

        {/* Hero amount — count-up animated */}
        <div className="flex items-baseline gap-2">
          <CountUp
            value={Math.abs(me)}
            currency={currency}
            className={cn(
              "text-4xl sm:text-5xl font-black tracking-[-0.02em]",
              toneClass.accent,
            )}
          />
        </div>

        <p className="text-xs text-slate-500 mt-1.5">
          {allSettled
            ? "Keine offenen Beträge — saubere Sache."
            : me > 0
            ? "Kommt insgesamt wieder auf dein Konto zurück."
            : me < 0
            ? "Das schuldest du den anderen Teilnehmern."
            : "Noch keine Aktivität."}
        </p>

        {/* Expanded — per-member bars */}
        <motion.div
          initial={false}
          animate={{
            height: expanded ? "auto" : 0,
            opacity: expanded ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-2.5">
            {balances
              .slice()
              .sort((a, b) => b.net_balance - a.net_balance)
              .map((b, idx) => {
                const p = participants.find((x) => x.id === b.participant_id);
                const name = p?.name ?? "?";
                const pos = b.net_balance > 0.005;
                const neg = b.net_balance < -0.005;
                const width = Math.min(100, (Math.abs(b.net_balance) / maxAbs) * 100);
                return (
                  <motion.div
                    key={b.participant_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
                    transition={{ delay: expanded ? idx * 0.04 : 0, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
                        b.participant_id === currentParticipantId
                          ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                          : "bg-white/[0.05] border-white/[0.08] text-slate-200",
                      )}
                    >
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 truncate">
                        {name}
                        {b.participant_id === currentParticipantId && (
                          <span className="ml-1.5 text-[10px] text-violet-300 font-medium">(Du)</span>
                        )}
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-1">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            pos
                              ? "bg-gradient-to-r from-emerald-400/80 to-emerald-300/60"
                              : neg
                              ? "bg-gradient-to-r from-rose-400/80 to-rose-300/60"
                              : "bg-slate-600/50",
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: expanded ? `${width}%` : 0 }}
                          transition={{ delay: expanded ? idx * 0.04 + 0.1 : 0, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-sm font-semibold tabular-nums tracking-tight shrink-0",
                        pos ? "text-emerald-300" : neg ? "text-rose-300" : "text-slate-500",
                      )}
                    >
                      {pos ? "+" : ""}
                      {formatMoney(b.net_balance, currency)}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
