import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Trash2,
  Receipt as ReceiptIcon,
  Calendar,
  StickyNote,
  User as UserIcon,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/expenses-v2/types";
import { useDeleteExpenseV2 } from "@/hooks/expenses";
import { useHaptics } from "@/hooks/useHaptics";
import type { Expense } from "@/lib/expenses-v2/types";

interface Participant {
  id: string;
  name?: string;
}

interface ExpenseDetailSheetProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  participants: Participant[];
  currentParticipantId?: string;
  currency?: string;
}

/**
 * Read-only detail view for an expense. Tap a row → opens this sheet.
 * Shows hero amount, description, category, date, payer(s), per-person
 * split breakdown with paid-status checkmarks, notes, receipt link.
 * Danger-zone: delete button with confirm.
 */
export function ExpenseDetailSheet({
  open,
  onClose,
  expense,
  participants,
  currentParticipantId,
  currency = "EUR",
}: ExpenseDetailSheetProps) {
  const haptics = useHaptics();
  const deleteExpense = useDeleteExpenseV2(expense?.event_id ?? "");

  const nameOf = useMemo(() => {
    const map = new Map(participants.map((p) => [p.id, p.name ?? "?"]));
    return (id: string) => map.get(id) ?? "?";
  }, [participants]);

  if (!expense) return null;

  const payers = expense.payers ?? [];
  const shares = expense.shares ?? [];
  const iAmPayer = payers.some((p) => p.participant_id === currentParticipantId);

  const handleDelete = async () => {
    if (!confirm("Ausgabe wirklich löschen?")) return;
    await haptics.warning();
    await deleteExpense.mutateAsync({ id: expense.id });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0B0D12] border-t border-white/10 text-white p-0 h-[92vh] max-h-[92vh] rounded-t-3xl flex flex-col"
      >
        <SheetTitle className="sr-only">Ausgabe: {expense.description}</SheetTitle>

        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.06]">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
          <h2 className="text-sm font-semibold text-slate-300">Ausgabe</h2>
          <div className="w-9 h-9" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="px-5 pt-6 pb-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center text-3xl mb-3">
              {expense.emoji ?? "💰"}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
              {expense.description}
            </h1>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-[-0.02em] tabular-nums mt-3">
              {formatMoney(expense.amount, expense.currency ?? currency)}
            </div>
            {expense.original_currency && expense.original_currency !== expense.currency && (
              <div className="text-xs text-slate-500 mt-1">
                {expense.original_currency} @ {expense.exchange_rate?.toFixed(4)}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(expense.expense_date).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
            {expense.is_settled_cached ? (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Alle Anteile beglichen
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[11px] font-semibold">
                <Circle className="w-3 h-3" />
                Noch offene Anteile
              </div>
            )}
          </div>

          {/* Payers */}
          <Section title="Gezahlt von">
            <div className="space-y-1.5">
              {payers.length === 0 ? (
                <div className="text-xs text-slate-500 italic">Unbekannt</div>
              ) : (
                payers.map((p) => (
                  <PersonRow
                    key={p.id}
                    name={nameOf(p.participant_id)}
                    amount={p.amount}
                    currency={currency}
                    tone="emerald"
                    isCurrentUser={p.participant_id === currentParticipantId}
                  />
                ))
              )}
            </div>
          </Section>

          {/* Shares — who owes what */}
          <Section title="Aufteilung">
            {shares.length === 0 ? (
              <div className="text-xs text-slate-500 italic">Keine Anteile gespeichert</div>
            ) : (
              <div className="space-y-1.5">
                {shares.map((s) => {
                  const paid = s.paid_amount >= s.amount - 0.005;
                  const pct = s.amount > 0 ? s.paid_amount / s.amount : 0;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "rounded-2xl border p-3 flex items-center gap-3",
                        paid
                          ? "bg-emerald-500/[0.05] border-emerald-500/20"
                          : "bg-white/[0.03] border-white/[0.06]",
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
                          s.participant_id === currentParticipantId
                            ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                            : "bg-white/[0.06] border-white/[0.08] text-slate-200",
                        )}
                      >
                        {nameOf(s.participant_id).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate flex items-center gap-1.5">
                          {nameOf(s.participant_id)}
                          {s.participant_id === currentParticipantId && (
                            <span className="text-[10px] text-violet-300 font-medium">(Du)</span>
                          )}
                        </div>
                        {s.paid_amount > 0 && s.paid_amount < s.amount && (
                          <div className="mt-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                            <div
                              className="h-full bg-emerald-400/70"
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            paid ? "text-emerald-300" : "text-white",
                          )}
                        >
                          {formatMoney(s.amount, currency)}
                        </div>
                        {paid ? (
                          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 justify-end">
                            <CheckCircle2 className="w-2.5 h-2.5" /> beglichen
                          </div>
                        ) : s.paid_amount > 0 ? (
                          <div className="text-[10px] text-amber-400 font-semibold tabular-nums">
                            {formatMoney(s.paid_amount, currency)} gezahlt
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end">
                            <Circle className="w-2.5 h-2.5" /> offen
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Notes */}
          {expense.notes && (
            <Section title="Notiz" icon={StickyNote}>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-sm text-slate-300 whitespace-pre-wrap">
                {expense.notes}
              </div>
            </Section>
          )}

          {/* Receipt */}
          {expense.receipt_url && (
            <Section title="Beleg" icon={ReceiptIcon}>
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/30 overflow-hidden transition-colors"
              >
                <img
                  src={expense.receipt_url}
                  alt="Beleg"
                  className="w-full max-h-64 object-contain bg-black/20"
                  onError={(e) => {
                    // If it's a non-image (PDF), fall back to filename
                    (e.currentTarget.style.display = "none");
                  }}
                />
                <div className="p-2 text-[11px] text-cyan-300 text-center">Beleg öffnen</div>
              </a>
            </Section>
          )}

          {/* Metadata */}
          <Section title="Details" icon={UserIcon}>
            <dl className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs space-y-1.5">
              <Row k="Erfasst">{formatDateTime(expense.created_at)}</Row>
              {expense.updated_at !== expense.created_at && (
                <Row k="Aktualisiert">{formatDateTime(expense.updated_at)}</Row>
              )}
              <Row k="Quelle">{labelCreatedVia(expense.created_via)}</Row>
              {expense.tags && expense.tags.length > 0 && (
                <Row k="Tags">{expense.tags.join(", ")}</Row>
              )}
            </dl>
          </Section>

          {/* Danger zone */}
          <div className="px-5 pb-8 pt-2">
            <Button
              onClick={handleDelete}
              variant="ghost"
              disabled={deleteExpense.isPending}
              className="w-full h-11 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Ausgabe löschen
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 pb-5">
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {title}
      </div>
      {children}
    </div>
  );
}

function PersonRow({
  name,
  amount,
  currency,
  tone,
  isCurrentUser,
}: {
  name: string;
  amount: number;
  currency: string;
  tone: "emerald" | "rose" | "slate";
  isCurrentUser?: boolean;
}) {
  const tonal = {
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    slate: "text-slate-100",
  }[tone];
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3">
      <div
        className={cn(
          "w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
          isCurrentUser
            ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
            : "bg-white/[0.06] border-white/[0.08] text-slate-200",
        )}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 truncate">
          {name}
          {isCurrentUser && (
            <span className="ml-1.5 text-[10px] text-violet-300 font-medium">(Du)</span>
          )}
        </div>
      </div>
      <div className={cn("text-sm font-bold tabular-nums", tonal)}>
        {formatMoney(amount, currency)}
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-300 font-mono text-right truncate">{children}</dd>
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelCreatedVia(v: string | null | undefined) {
  return (
    { manual: "Manuell", camera: "Kamera-OCR", voice: "Spracheingabe", import: "Import", template: "Vorlage" } as Record<string, string>
  )[v ?? "manual"] ?? v ?? "Manuell";
}
