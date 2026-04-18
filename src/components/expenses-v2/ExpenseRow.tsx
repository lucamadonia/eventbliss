import { motion } from "framer-motion";
import { CheckCircle2, Circle, Receipt as ReceiptIcon, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/expenses-v2/types";
import type { Expense } from "@/lib/expenses-v2/types";

interface Participant {
  id: string;
  name?: string;
}

interface ExpenseRowProps {
  expense: Expense;
  participants: Participant[];
  currentParticipantId?: string;
  currency?: string;
  onTap?: (expenseId: string) => void;
  onMore?: (expenseId: string) => void;
}

/**
 * ExpenseRow — compact card for the list. Left: emoji/category.
 * Middle: description + payer + split preview. Right: amount + settled
 * badge. Mobile-first with 44px+ touch targets. Swipe actions are
 * wired at the list level (not here) so the row stays a pure cell.
 */
export function ExpenseRow({
  expense,
  participants,
  currentParticipantId,
  currency = "EUR",
  onTap,
  onMore,
}: ExpenseRowProps) {
  const payer = expense.payers?.[0];
  const payerName =
    payer && participants.find((p) => p.id === payer.participant_id)?.name;
  const myShare = expense.shares?.find(
    (s) => s.participant_id === currentParticipantId,
  );
  const myAmount = myShare?.amount ?? 0;
  const myPaid = myShare?.paid_amount ?? 0;
  const iAmPayer = payer?.participant_id === currentParticipantId;
  const iOwe = !iAmPayer && myAmount > myPaid;

  return (
    <motion.button
      layout
      type="button"
      onClick={() => onTap?.(expense.id)}
      className={cn(
        "w-full text-left rounded-2xl p-4 flex items-center gap-3 min-h-[64px] transition-colors cursor-pointer",
        "bg-[#14171F] border border-[#2A2E37] hover:border-violet-400/30 hover:bg-[#1A1E28]",
      )}
      whileTap={{ scale: 0.98 }}
    >
      {/* Emoji / category badge */}
      <div
        className={cn(
          "flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl",
          expense.is_settled_cached
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-white/[0.04] border border-white/[0.06]",
        )}
      >
        {expense.emoji ?? "💰"}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="text-sm font-semibold text-white truncate">
            {expense.description}
          </h3>
          {expense.receipt_url && (
            <ReceiptIcon
              className="w-3 h-3 text-cyan-400 flex-shrink-0"
              aria-label="Beleg vorhanden"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="truncate">
            {payerName ? `${payerName} zahlte` : "Unbekannter Zahler"}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500 shrink-0">
            {new Date(expense.expense_date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          {expense.shares && expense.shares.length > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 shrink-0">
                {expense.shares.length} Personen
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount + my-share badge */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div className="text-sm font-bold text-white tabular-nums">
          {formatMoney(expense.amount, expense.currency ?? currency)}
        </div>
        {iAmPayer && myAmount > 0 ? (
          <div className="text-[10px] text-emerald-400 font-semibold tabular-nums">
            +{formatMoney(expense.amount - myAmount, currency)}
          </div>
        ) : iOwe ? (
          <div className="text-[10px] text-rose-400 font-semibold tabular-nums">
            –{formatMoney(myAmount - myPaid, currency)}
          </div>
        ) : expense.is_settled_cached ? (
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> beglichen
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 flex items-center gap-0.5">
            <Circle className="w-2.5 h-2.5" /> offen
          </div>
        )}
      </div>

      {/* More menu — stopPropagation so the row tap still fires */}
      {onMore && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMore(expense.id);
          }}
          className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-500 cursor-pointer"
          aria-label="Mehr"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      )}
    </motion.button>
  );
}
