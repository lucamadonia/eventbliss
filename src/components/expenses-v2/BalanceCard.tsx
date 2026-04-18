import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CheckCircle2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/expenses-v2/types";
import type { ParticipantBalance } from "@/lib/expenses-v2/types";

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
 * Balance At-a-Glance Card — the hero of the expenses module.
 * Shows the current user's net balance in huge type, with a per-member
 * breakdown when expanded. Money-positive is emerald, money-negative is
 * rose, zero is muted. Dark-mode native palette.
 */
export function BalanceCard({
  balances,
  participants,
  currentParticipantId,
  currency = "EUR",
  expanded = false,
  onToggle,
}: BalanceCardProps) {
  const byId = new Map(balances.map((b) => [b.participant_id, b.net_balance]));
  const me = currentParticipantId ? byId.get(currentParticipantId) ?? 0 : 0;
  const allSettled = balances.every((b) => Math.abs(b.net_balance) < 0.005);

  const tone = allSettled
    ? "bg-[#14171F] border-[#2A2E37]"
    : me > 0
    ? "bg-gradient-to-br from-emerald-500/[0.08] via-[#14171F] to-[#14171F] border-emerald-500/20"
    : me < 0
    ? "bg-gradient-to-br from-rose-500/[0.08] via-[#14171F] to-[#14171F] border-rose-500/20"
    : "bg-[#14171F] border-[#2A2E37]";

  const Icon = allSettled ? CheckCircle2 : me > 0 ? TrendingUp : me < 0 ? TrendingDown : Wallet;

  return (
    <motion.div
      layout
      className={cn(
        "relative w-full rounded-3xl border p-5 overflow-hidden backdrop-blur-xl",
        tone,
      )}
      onClick={onToggle}
      role={onToggle ? "button" : undefined}
      aria-expanded={expanded}
    >
      {/* Top row — status chip */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              allSettled
                ? "bg-emerald-500/15 text-emerald-300"
                : me > 0
                ? "bg-emerald-500/15 text-emerald-300"
                : me < 0
                ? "bg-rose-500/15 text-rose-300"
                : "bg-white/[0.06] text-slate-400",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-400">
            {allSettled
              ? "Alles beglichen"
              : me > 0
              ? "Dir wird geschuldet"
              : me < 0
              ? "Du schuldest"
              : "Net-Balance"}
          </span>
        </div>
        {onToggle && (
          <span className="text-[11px] text-slate-500">{expanded ? "–" : "+"}</span>
        )}
      </div>

      {/* Hero amount */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-4xl sm:text-5xl font-black tracking-tight tabular-nums",
            allSettled
              ? "text-emerald-300"
              : me > 0
              ? "text-emerald-300"
              : me < 0
              ? "text-rose-300"
              : "text-slate-100",
          )}
        >
          {allSettled ? "0,00 €" : formatMoney(Math.abs(me), currency)}
        </span>
      </div>

      {!allSettled && (
        <p className="text-xs text-slate-500 mt-1">
          {me > 0
            ? "Insgesamt kommt das auf dein Konto zurück"
            : me < 0
            ? "Das schuldest du den anderen Teilnehmern"
            : "Keine offenen Beträge"}
        </p>
      )}

      {/* Expanded — per-member bars */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-5 pt-5 border-t border-white/[0.06] space-y-2.5"
        >
          {balances
            .slice()
            .sort((a, b) => b.net_balance - a.net_balance)
            .map((b) => {
              const p = participants.find((x) => x.id === b.participant_id);
              const name = p?.name ?? "?";
              const pos = b.net_balance > 0.005;
              const neg = b.net_balance < -0.005;
              return (
                <div key={b.participant_id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{name}</div>
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-0.5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pos ? "bg-emerald-400/70" : neg ? "bg-rose-400/70" : "bg-slate-600/50",
                        )}
                        style={{
                          width: `${Math.min(
                            100,
                            (Math.abs(b.net_balance) /
                              Math.max(...balances.map((x) => Math.abs(x.net_balance)), 1)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-semibold tabular-nums tracking-tight",
                      pos ? "text-emerald-300" : neg ? "text-rose-300" : "text-slate-400",
                    )}
                  >
                    {pos ? "+" : ""}
                    {formatMoney(b.net_balance, currency)}
                  </div>
                </div>
              );
            })}
        </motion.div>
      )}
    </motion.div>
  );
}
