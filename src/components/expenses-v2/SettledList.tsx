import { motion } from "framer-motion";
import { CheckCircle2, Clock as ClockIcon, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/expenses-v2/types";
import { useSettlements, useConfirmSettlementByPayee } from "@/hooks/expenses";
import { useHaptics } from "@/hooks/useHaptics";
import type { ExpenseSettlement, SettlementMethod } from "@/lib/expenses-v2/types";

interface Participant {
  id: string;
  user_id?: string | null;
  name?: string;
}

interface SettledListProps {
  eventId: string;
  participants: Participant[];
  currentParticipantId?: string;
  currency?: string;
}

const METHOD_META: Record<SettlementMethod, { label: string; emoji: string; tint: string }> = {
  cash: { label: "Bar", emoji: "💶", tint: "text-amber-300 bg-amber-500/15 border-amber-500/25" },
  bank: { label: "Überweisung", emoji: "🏦", tint: "text-sky-300 bg-sky-500/15 border-sky-500/25" },
  paypal: { label: "PayPal", emoji: "💙", tint: "text-blue-300 bg-blue-500/15 border-blue-500/25" },
  revolut: { label: "Revolut", emoji: "🟣", tint: "text-violet-300 bg-violet-500/15 border-violet-500/25" },
  wise: { label: "Wise", emoji: "🟢", tint: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25" },
  apple_pay: { label: "Apple Pay", emoji: "", tint: "text-slate-200 bg-white/[0.08] border-white/[0.12]" },
  google_pay: { label: "Google Pay", emoji: "G", tint: "text-slate-200 bg-white/[0.08] border-white/[0.12]" },
  other: { label: "Sonstiges", emoji: "↗", tint: "text-slate-300 bg-white/[0.05] border-white/[0.08]" },
};

/**
 * SettledList — History all recorded settlements (both confirmed and
 * pending payee-side confirmation). Grouped into:
 *   - "Warten auf Bestätigung" (payee hasn't confirmed yet)
 *   - "Erledigt" (both sides confirmed)
 */
export function SettledList({
  eventId,
  participants,
  currentParticipantId,
  currency = "EUR",
}: SettledListProps) {
  const { data: settlements = [], isLoading } = useSettlements(eventId);
  const confirm = useConfirmSettlementByPayee(eventId);
  const haptics = useHaptics();

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "?";

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Noch keine Zahlungen erfasst.</p>
      </div>
    );
  }

  const pending = settlements.filter((s) => !s.confirmed_by_payee_at);
  const done = settlements.filter((s) => !!s.confirmed_by_payee_at);

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-bold mb-2 px-1 flex items-center gap-1.5">
            <ClockIcon className="w-3 h-3" /> Warten auf Bestätigung ({pending.length})
          </div>
          <div className="space-y-2">
            {pending.map((s) => (
              <SettlementCardV
                key={s.id}
                settlement={s}
                nameOf={nameOf}
                currency={currency}
                pending
                canConfirm={
                  !!currentParticipantId &&
                  s.to_participant_id === currentParticipantId &&
                  !s.confirmed_by_payee_at
                }
                onConfirm={async () => {
                  await haptics.success();
                  await confirm.mutateAsync({ settlementId: s.id });
                }}
                confirming={confirm.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300 font-bold mb-2 px-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" /> Erledigt ({done.length})
          </div>
          <div className="space-y-2">
            {done.map((s) => (
              <SettlementCardV
                key={s.id}
                settlement={s}
                nameOf={nameOf}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

interface SettlementCardProps {
  settlement: ExpenseSettlement;
  nameOf: (id: string) => string;
  currency: string;
  pending?: boolean;
  canConfirm?: boolean;
  onConfirm?: () => void;
  confirming?: boolean;
}

function SettlementCardV({
  settlement: s,
  nameOf,
  currency,
  pending,
  canConfirm,
  onConfirm,
  confirming,
}: SettlementCardProps) {
  const method = METHOD_META[s.method] ?? METHOD_META.other;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-3",
        pending
          ? "bg-gradient-to-br from-amber-500/[0.06] via-[#14171F] to-[#14171F] border-amber-500/25"
          : "bg-gradient-to-br from-emerald-500/[0.05] via-[#14171F] to-[#14171F] border-emerald-500/20",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold shrink-0",
            )}
          >
            {nameOf(s.from_participant_id).slice(0, 1).toUpperCase()}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 flex items-center justify-center text-[10px] font-bold shrink-0">
            {nameOf(s.to_participant_id).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 ml-1">
            <div className="text-xs text-slate-300 truncate">
              <span className="font-semibold">{nameOf(s.from_participant_id)}</span>
              <span className="text-slate-500"> → </span>
              <span className="font-semibold">{nameOf(s.to_participant_id)}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {new Date(s.created_at).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold tabular-nums text-white">
            {formatMoney(s.amount, s.currency ?? currency)}
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border mt-1",
              method.tint,
            )}
          >
            <span>{method.emoji}</span>
            {method.label}
          </div>
        </div>
      </div>

      {pending && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <div className="flex-1 text-[11px] text-amber-300/90 leading-snug">
            {canConfirm
              ? "Du hast das Geld erhalten? Bitte bestätigen."
              : "Warten auf Bestätigung durch Empfänger"}
          </div>
          {canConfirm && (
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={confirming}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold"
            >
              {confirming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Bestätigen
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
