import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowLeft, Sparkles, Clock, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import {
  useExpensesV2,
  useBalances,
  useSimplifiedDebts,
} from "@/hooks/expenses";
import { BalanceCard } from "@/components/expenses-v2/BalanceCard";
import { AddExpenseSheet } from "@/components/expenses-v2/AddExpenseSheet";
import { ExpenseRow } from "@/components/expenses-v2/ExpenseRow";
import { SettlementFlow } from "@/components/expenses-v2/SettlementFlow";
import { formatMoney } from "@/lib/expenses-v2/types";

type Tab = "list" | "settle" | "timeline";

/**
 * EventExpensesV2 — the new home of the Expenses module.
 * Mobile-first dark-themed ledger. Hero balance card, day-grouped list,
 * FAB to add, tabs for Settle + Timeline. Settlement flow uses the
 * simplified_debts RPC to minimize transfers.
 */
export default function EventExpensesV2() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, participants, isLoading: eventLoading } = useEvent(slug);

  const eventId = event?.id;
  const currency = event?.currency ?? "EUR";

  const { data, isLoading: expensesLoading } = useExpensesV2(eventId);
  const { data: balances = [] } = useBalances(eventId);
  const { data: simplifiedDebts = [] } = useSimplifiedDebts(eventId);

  const [tab, setTab] = useState<Tab>("list");
  const [addOpen, setAddOpen] = useState(false);
  const [balanceExpanded, setBalanceExpanded] = useState(false);

  const currentParticipantId = useMemo(
    () => participants?.find((p) => p.user_id === user?.id)?.id,
    [participants, user?.id],
  );

  const grouped = useMemo(() => {
    if (!data?.items) return [] as Array<{ date: string; items: typeof data.items }>;
    const map = new Map<string, typeof data.items>();
    for (const e of data.items) {
      const d = e.expense_date.slice(0, 10);
      const list = map.get(d) ?? [];
      list.push(e);
      map.set(d, list);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({ date, items }));
  }, [data]);

  if (eventLoading || !event) {
    return (
      <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D12] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0B0D12]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">Ausgaben</h1>
            <p className="text-[11px] text-slate-500 truncate">{event.title}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Gesamt
            </div>
            <div className="text-sm font-bold tabular-nums">
              {formatMoney(data?.summary.totalAmount ?? 0, currency)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {([
            { id: "list", label: "Liste", count: data?.summary.count ?? 0 },
            { id: "settle", label: "Begleichen", count: simplifiedDebts.length },
            { id: "timeline", label: "Timeline" },
          ] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 h-9 rounded-full text-xs font-medium cursor-pointer flex-shrink-0 transition-colors flex items-center gap-1.5",
                  active
                    ? "bg-gradient-to-r from-violet-500/25 to-cyan-500/20 border border-violet-400/40 text-white"
                    : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200",
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className={cn(
                      "min-w-[18px] h-[18px] rounded-full px-1.5 text-[10px] font-bold flex items-center justify-center",
                      active ? "bg-white/20 text-white" : "bg-white/[0.06] text-slate-300",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        {/* Balance card always visible */}
        <BalanceCard
          balances={balances}
          participants={(participants ?? []).map((p) => ({ id: p.id, name: p.name ?? undefined }))}
          currentParticipantId={currentParticipantId}
          currency={currency}
          expanded={balanceExpanded}
          onToggle={() => setBalanceExpanded((v) => !v)}
        />

        {/* Tab content */}
        <div className="mt-5">
          {tab === "list" && (
            <>
              {expensesLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
                    />
                  ))}
                </div>
              ) : grouped.length === 0 ? (
                <EmptyList onAdd={() => setAddOpen(true)} />
              ) : (
                <div className="space-y-5">
                  <AnimatePresence mode="popLayout">
                    {grouped.map((group) => (
                      <motion.div key={group.date} layout>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-1">
                          {formatDateGroup(group.date)}
                        </div>
                        <div className="space-y-2">
                          {group.items.map((expense) => (
                            <ExpenseRow
                              key={expense.id}
                              expense={expense}
                              participants={(participants ?? []).map((p) => ({
                                id: p.id,
                                name: p.name ?? undefined,
                              }))}
                              currentParticipantId={currentParticipantId}
                              currency={currency}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {tab === "settle" && eventId && (
            <SettlementFlow
              eventId={eventId}
              debts={simplifiedDebts}
              participants={(participants ?? []).map((p) => ({
                id: p.id,
                name: p.name ?? undefined,
              }))}
              currentParticipantId={currentParticipantId}
              currency={currency}
              onSettled={() => setTab("list")}
            />
          )}

          {tab === "timeline" && (
            <div className="p-8 text-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Timeline</h3>
              <p className="text-xs text-slate-500">
                Kommt als Teil von Phase 5 (Activity-Timeline mit Pinch-Zoom).
              </p>
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      {tab === "list" && eventId && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setAddOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-2xl shadow-violet-500/40 flex items-center justify-center cursor-pointer"
          aria-label="Ausgabe hinzufügen"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Add sheet */}
      {eventId && (
        <AddExpenseSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          eventId={eventId}
          participants={(participants ?? []).map((p) => ({
            id: p.id,
            name: p.name ?? undefined,
          }))}
          currency={currency}
          defaultPayerId={currentParticipantId}
        />
      )}
    </div>
  );
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Gestern";
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: diff > 180 ? "numeric" : undefined,
  });
}

function EmptyList({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="p-8 text-center rounded-3xl bg-gradient-to-br from-violet-500/[0.05] to-cyan-500/[0.03] border border-violet-500/15">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
        <ReceiptIcon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">Noch keine Ausgaben</h3>
      <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
        Trag die erste Ausgabe ein — Splits werden automatisch berechnet, Balance live aktualisiert.
      </p>
      <Button
        onClick={onAdd}
        className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-bold"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Erste Ausgabe hinzufügen
      </Button>
    </div>
  );
}
