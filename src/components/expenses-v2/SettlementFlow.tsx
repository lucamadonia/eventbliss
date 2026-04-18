import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/expenses-v2/types";
import { useSettleDebt } from "@/hooks/expenses";
import type { SettlementMethod, SimplifiedDebt } from "@/lib/expenses-v2/types";

interface Participant {
  id: string;
  name?: string;
  paypal_me?: string;
  revolut_tag?: string;
  iban?: string;
}

interface SettlementFlowProps {
  eventId: string;
  debts: SimplifiedDebt[];
  participants: Participant[];
  currentParticipantId?: string;
  currency?: string;
  onSettled?: () => void;
}

const METHOD_LABELS: Record<SettlementMethod, { label: string; emoji: string; deepLink?: (p: Participant, amount: number) => string | null }> = {
  paypal: {
    label: "PayPal",
    emoji: "💙",
    deepLink: (p, a) => (p.paypal_me ? `https://paypal.me/${p.paypal_me}/${a.toFixed(2)}` : null),
  },
  revolut: {
    label: "Revolut",
    emoji: "🟣",
    deepLink: (p, a) => (p.revolut_tag ? `https://revolut.me/${p.revolut_tag}?amount=${a.toFixed(2)}` : null),
  },
  bank: {
    label: "Überweisung",
    emoji: "🏦",
    deepLink: (p, a) =>
      p.iban
        ? `bank://transfer?iban=${encodeURIComponent(p.iban)}&amount=${a.toFixed(2)}`
        : null,
  },
  wise: { label: "Wise", emoji: "🟢" },
  apple_pay: { label: "Apple Pay", emoji: "" },
  google_pay: { label: "Google Pay", emoji: "G" },
  cash: { label: "Bar", emoji: "💶" },
  other: { label: "Sonstiges", emoji: "↗" },
};

/**
 * SettlementFlow — shows the minimal transfer graph from simplified_debts
 * RPC. Each row = one transfer. Tap a row to pick a method and fire
 * the settlement (which also deep-links to the payment app if available).
 */
export function SettlementFlow({
  eventId,
  debts,
  participants,
  currentParticipantId,
  currency = "EUR",
  onSettled,
}: SettlementFlowProps) {
  const [activeDebtKey, setActiveDebtKey] = useState<string | null>(null);
  const settle = useSettleDebt();

  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "?";

  if (debts.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Alles beglichen</h3>
        <p className="text-sm text-slate-400">
          Keine offenen Beträge zwischen den Teilnehmern.
        </p>
      </div>
    );
  }

  const handleSettle = async (debt: SimplifiedDebt, method: SettlementMethod) => {
    const toParticipant = participants.find((p) => p.id === debt.to_participant_id);
    const config = METHOD_LABELS[method];
    const link = toParticipant && config.deepLink ? config.deepLink(toParticipant, debt.amount) : null;

    await settle.mutateAsync({
      eventId,
      fromParticipantId: debt.from_participant_id,
      toParticipantId: debt.to_participant_id,
      amount: debt.amount,
      method,
      currency,
      referenceUrl: link ?? undefined,
    });

    setActiveDebtKey(null);

    if (link) {
      window.open(link, "_blank");
    }

    onSettled?.();
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold">
        Minimale Ausgleichs-Überweisungen ({debts.length})
      </div>
      {debts.map((d) => {
        const key = `${d.from_participant_id}:${d.to_participant_id}`;
        const isMine = d.from_participant_id === currentParticipantId;
        const open = activeDebtKey === key;
        return (
          <div
            key={key}
            className={cn(
              "rounded-2xl border transition-colors",
              isMine
                ? "bg-gradient-to-br from-rose-500/[0.06] to-[#14171F] border-rose-500/20"
                : "bg-[#14171F] border-[#2A2E37]",
            )}
          >
            <button
              type="button"
              onClick={() => setActiveDebtKey(open ? null : key)}
              className="w-full p-4 flex items-center gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isMine ? "bg-rose-500/20 text-rose-200" : "bg-white/[0.06] text-slate-300",
                  )}
                >
                  {nameOf(d.from_participant_id).slice(0, 1).toUpperCase()}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {nameOf(d.to_participant_id).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 ml-1">
                  <div className="text-xs text-slate-300 truncate">
                    <span className={isMine ? "font-semibold text-rose-200" : ""}>
                      {nameOf(d.from_participant_id)}
                    </span>
                    <span className="text-slate-500"> → </span>
                    <span className="font-semibold text-emerald-200">
                      {nameOf(d.to_participant_id)}
                    </span>
                  </div>
                  {isMine && (
                    <div className="text-[10px] text-rose-300/80 mt-0.5">Deine Überweisung</div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "text-base font-bold tabular-nums",
                  isMine ? "text-rose-200" : "text-slate-100",
                )}
              >
                {formatMoney(d.amount, currency)}
              </div>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-white/[0.04] mt-1">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                      Zahlungsmethode
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(METHOD_LABELS) as SettlementMethod[]).map((m) => {
                        const cfg = METHOD_LABELS[m];
                        const to = participants.find((p) => p.id === d.to_participant_id);
                        const hasDeepLink = to && cfg.deepLink && cfg.deepLink(to, d.amount);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSettle(d, m)}
                            disabled={settle.isPending}
                            className="h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-violet-400/40 hover:bg-white/[0.06] text-sm font-medium text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-lg">{cfg.emoji}</span>
                            <span className="flex-1 text-left">{cfg.label}</span>
                            {hasDeepLink && (
                              <span className="text-[9px] text-emerald-400 font-bold">LINK</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => setActiveDebtKey(null)}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-slate-400"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Abbrechen
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {settle.isPending && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 pt-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Wird gespeichert…
        </div>
      )}
    </div>
  );
}
