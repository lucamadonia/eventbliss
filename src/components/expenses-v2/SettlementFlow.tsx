import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExpenseFormat } from "./useExpenseFormat";
import { useSettleDebt } from "@/hooks/expenses";
import type { SettlementMethod, SimplifiedDebt } from "@/lib/expenses-v2/types";
import { buildSettlementAction, hasDeepLink } from "@/lib/expenses-v2/paymentLinks";

interface Participant {
  id: string;
  name?: string;
  paypal_me?: string;
  revolut_tag?: string;
  iban?: string;
  bic?: string;
  twint_number?: string;
}

interface SettlementFlowProps {
  eventId: string;
  debts: SimplifiedDebt[];
  participants: Participant[];
  currentParticipantId?: string;
  currency?: string;
  onSettled?: () => void;
}

/** Reihenfolge der Kacheln im Methoden-Raster — unabhängig von der Sprache. */
const METHOD_ORDER: SettlementMethod[] = [
  "paypal", "revolut", "bank", "wise", "apple_pay", "google_pay", "cash", "other",
];

const METHOD_EMOJI: Record<SettlementMethod, string> = {
  paypal: "💙",
  revolut: "🟣",
  bank: "🏦",
  wise: "🟢",
  apple_pay: "",
  google_pay: "G",
  cash: "💶",
  other: "↗",
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
  const { t } = useTranslation();
  const fmt = useExpenseFormat(currency);
  const [activeDebtKey, setActiveDebtKey] = useState<string | null>(null);
  const settle = useSettleDebt();

  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? "?";

  if (debts.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
          <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {t("expenses.v2.settle.allSettledTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("expenses.v2.settle.noOpenAmounts")}</p>
      </div>
    );
  }

  const handleSettle = async (debt: SimplifiedDebt, method: SettlementMethod) => {
    const toParticipant = participants.find((p) => p.id === debt.to_participant_id);
    const action = toParticipant
      ? buildSettlementAction(
          method,
          toParticipant,
          debt.amount,
          t("expenses.v2.settle.referenceNote", { name: nameOf(debt.from_participant_id) }),
        )
      : null;

    await settle.mutateAsync({
      eventId,
      fromParticipantId: debt.from_participant_id,
      toParticipantId: debt.to_participant_id,
      amount: debt.amount,
      method,
      currency,
      referenceUrl: action?.kind === "open" ? action.url : undefined,
    });

    setActiveDebtKey(null);

    if (action?.kind === "open") {
      window.open(action.url, "_blank");
    } else if (action?.kind === "copy") {
      try {
        await navigator.clipboard.writeText(action.value);
        toast.success(t("expenses.v2.settle.ibanCopied"));
      } catch {
        toast.info(t("expenses.v2.settle.copyFailed"));
      }
    }

    onSettled?.();
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
        {t("expenses.v2.settle.minimalTransfers", { n: debts.length })}
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
                ? "bg-gradient-to-br from-rose-500/[0.06] to-card border-rose-500/20"
                : "bg-card border-border",
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
                    isMine ? "bg-rose-500/20 text-rose-600 dark:text-rose-200" : "bg-muted text-muted-foreground",
                  )}
                >
                  {nameOf(d.from_participant_id).slice(0, 1).toUpperCase()}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {nameOf(d.to_participant_id).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 ml-1">
                  <div className="text-xs text-muted-foreground truncate">
                    <span className={isMine ? "font-semibold text-rose-600 dark:text-rose-200" : ""}>
                      {nameOf(d.from_participant_id)}
                    </span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-200">
                      {nameOf(d.to_participant_id)}
                    </span>
                  </div>
                  {isMine && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-300/80 mt-0.5">
                      {t("expenses.v2.settle.yourTransfer")}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "text-base font-bold tabular-nums",
                  isMine ? "text-rose-600 dark:text-rose-200" : "text-foreground",
                )}
              >
                {fmt.money(d.amount)}
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
                  <div className="p-4 pt-0 border-t border-border mt-1">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                      {t("expenses.v2.settle.paymentMethod")}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {METHOD_ORDER.map((m) => {
                        const to = participants.find((p) => p.id === d.to_participant_id);
                        const action = to ? buildSettlementAction(m, to, d.amount) : null;
                        const linkable = to ? hasDeepLink(m, to, d.amount) : false;
                        const copyable = action?.kind === "copy";
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSettle(d, m)}
                            disabled={settle.isPending}
                            className="h-11 px-3 rounded-xl bg-muted border border-border hover:border-violet-400/40 hover:bg-white/[0.06] text-sm font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-lg">{METHOD_EMOJI[m]}</span>
                            <span className="flex-1 text-start">{t(`expenses.v2.method.${m}`)}</span>
                            {linkable && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                {t("expenses.v2.settle.linkBadge")}
                              </span>
                            )}
                            {copyable && (
                              <Copy
                                className="w-3 h-3 text-muted-foreground"
                                aria-label={t("expenses.v2.settle.copyToClipboard")}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => setActiveDebtKey(null)}
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      {t("expenses.v2.common.cancel")}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {settle.isPending && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {t("expenses.v2.common.saving")}
        </div>
      )}
    </div>
  );
}
