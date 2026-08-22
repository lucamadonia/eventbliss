import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { CheckCircle2, Circle, Receipt as ReceiptIcon, Trash2, Pencil, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense } from "@/lib/expenses-v2/types";
import { useHaptics } from "@/hooks/useHaptics";
import { CategoryIcon, type CategoryLike } from "./CategoryIcon";
import { useExpenseFormat } from "./useExpenseFormat";

interface Participant {
  id: string;
  name?: string;
}

interface ExpenseRowProps {
  expense: Expense;
  participants: Participant[];
  category?: CategoryLike | null;
  currentParticipantId?: string;
  currency?: string;
  onTap?: (expenseId: string) => void;
  onEdit?: (expenseId: string) => void;
  onDelete?: (expenseId: string) => void;
}

const DELETE_THRESHOLD = -100;
const EDIT_THRESHOLD = -50;

export function ExpenseRow({
  expense,
  participants,
  category,
  currentParticipantId,
  currency = "EUR",
  onTap,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const { t } = useTranslation();
  const fmt = useExpenseFormat(currency);
  const haptics = useHaptics();
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const rowOpacity = useTransform(x, [-250, -120, 0], [0.5, 0.85, 1]);
  const editIconOpacity = useTransform(x, [-100, -50, 0], [1, 1, 0]);
  const deleteIconOpacity = useTransform(x, [-150, -100, 0], [1, 0.5, 0]);

  const payer = expense.payers?.[0];
  const payerName = payer && participants.find((p) => p.id === payer.participant_id)?.name;
  const myShare = expense.shares?.find((s) => s.participant_id === currentParticipantId);
  const myAmount = myShare?.amount ?? 0;
  const myPaid = myShare?.paid_amount ?? 0;
  const iAmPayer = payer?.participant_id === currentParticipantId;
  const iOwe = !iAmPayer && myAmount > myPaid;

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x < DELETE_THRESHOLD && onDelete) {
      await haptics.warning();
      onDelete(expense.id);
    } else if (info.offset.x < EDIT_THRESHOLD && onEdit) {
      await haptics.light();
      onEdit(expense.id);
    }
    // Animate back to 0 handled by dragSnapToOrigin
  };

  return (
    <div className="relative">
      {/* Swipe-action background (edit / delete) */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden flex items-center justify-end pr-4 gap-2 pointer-events-none">
        {onEdit && (
          <motion.div
            className="w-12 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"
            style={{ opacity: editIconOpacity }}
          >
            <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          </motion.div>
        )}
        {onDelete && (
          <motion.div
            className="w-12 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center"
            style={{ opacity: deleteIconOpacity }}
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-300" />
          </motion.div>
        )}
      </div>

      {/* Swipable row */}
      <motion.button
        type="button"
        drag={onEdit || onDelete ? "x" : false}
        dragConstraints={{ left: -180, right: 0 }}
        dragElastic={0.2}
        dragSnapToOrigin
        style={{ x, opacity: rowOpacity }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (!isDragging) {
            void haptics.light();
            onTap?.(expense.id);
          }
        }}
        whileTap={isDragging ? undefined : { scale: 0.98 }}
        className={cn(
          "relative z-10 w-full text-left rounded-2xl p-4 flex items-center gap-3 min-h-[72px] cursor-pointer",
          "bg-card border border-border hover:border-violet-400/30 hover:bg-muted transition-colors",
          "touch-pan-y",
        )}
      >
        {/* Category icon badge */}
        <div
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden",
            expense.is_settled_cached
              ? "bg-emerald-500/10 border border-emerald-500/20"
              : "bg-muted border border-border",
          )}
        >
          <CategoryIcon
            category={category ?? { name: expense.category, emoji: expense.emoji }}
            size="tile"
            className="w-10 h-10 relative z-10"
          />
          {expense.is_settled_cached && (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-semibold text-foreground truncate">{expense.description}</h3>
            {expense.receipt_url && (
              <ReceiptIcon
                className="w-3 h-3 text-cyan-600 dark:text-cyan-400 flex-shrink-0"
                aria-label={t("expenses.v2.row.hasReceipt")}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="truncate">
              {payerName
                ? t("expenses.v2.row.paidByName", { name: payerName })
                : t("expenses.v2.row.unknownPayer")}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground shrink-0">
              {fmt.shortDate(expense.expense_date)}
            </span>
            {expense.shares && expense.shares.length > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground shrink-0">
                  {t("expenses.v2.row.peopleCount", { n: expense.shares.length })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount + my-share badge */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <div className="text-sm font-bold text-foreground tabular-nums tracking-tight">
            {fmt.money(expense.amount, expense.currency ?? currency)}
          </div>
          {iAmPayer && myAmount > 0 ? (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              +{fmt.money(expense.amount - myAmount)}
            </div>
          ) : iOwe ? (
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
              –{fmt.money(myAmount - myPaid)}
            </div>
          ) : expense.is_settled_cached ? (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> {t("expenses.v2.common.settledLabel")}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Circle className="w-2.5 h-2.5" /> {t("expenses.v2.common.openLabel")}
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
