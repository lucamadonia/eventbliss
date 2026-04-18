import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Sparkles,
  Circle,
  CheckCircle2,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import {
  useExpensesV2,
  useBalances,
  useSimplifiedDebts,
  useDeleteExpenseV2,
} from "@/hooks/expenses";
import { BalanceCard } from "@/components/expenses-v2/BalanceCard";
import { AddExpenseSheet } from "@/components/expenses-v2/AddExpenseSheet";
import { ExpenseRow } from "@/components/expenses-v2/ExpenseRow";
import { ExpenseDetailSheet } from "@/components/expenses-v2/ExpenseDetailSheet";
import { SettlementFlow } from "@/components/expenses-v2/SettlementFlow";
import { SettledList } from "@/components/expenses-v2/SettledList";
import { ActivityTimeline } from "@/components/expenses-v2/ActivityTimeline";
import { RecurringPanel } from "@/components/expenses-v2/RecurringPanel";
import { AmbientBg } from "@/components/expenses-v2/AmbientBg";
import { CountUp } from "@/components/expenses-v2/CountUp";
import { Confetti } from "@/components/expenses-v2/Confetti";
import { formatMoney } from "@/lib/expenses-v2/types";

type Tab = "list" | "settle" | "timeline" | "recurring";

export default function EventExpensesV2() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { user } = useAuth();
  const { event, participants, isLoading: eventLoading } = useEvent(slug);

  const eventId = event?.id;
  const currency = event?.currency ?? "EUR";

  const { data, isLoading: expensesLoading } = useExpensesV2(eventId);
  const { data: balances = [] } = useBalances(eventId);
  const { data: simplifiedDebts = [] } = useSimplifiedDebts(eventId);
  const deleteExpense = useDeleteExpenseV2(eventId ?? "");

  const [tab, setTab] = useState<Tab>("list");
  const [addOpen, setAddOpen] = useState(false);
  const [balanceExpanded, setBalanceExpanded] = useState(false);
  const [confettiFire, setConfettiFire] = useState(false);
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
  const detailExpense = detailExpenseId
    ? data?.items.find((e) => e.id === detailExpenseId) ?? null
    : null;

  // Scroll-aware header
  const { scrollY } = useScroll();
  const headerBlur = useTransform(scrollY, [0, 100], [8, 24]);
  const headerBorderOpacity = useTransform(scrollY, [0, 100], [0, 0.1]);

  const currentParticipantId = useMemo(
    () => participants?.find((p) => p.user_id === user?.id)?.id,
    [participants, user?.id],
  );

  const myBalance = currentParticipantId
    ? balances.find((b) => b.participant_id === currentParticipantId)?.net_balance ?? 0
    : 0;

  // Tone for ambient background based on user's balance
  const tone = Math.abs(myBalance) < 0.005
    ? "neutral"
    : myBalance > 0
    ? "emerald"
    : "rose";

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

  // Detect when all debts resolve → fire confetti
  const allSettled = balances.length > 0 && balances.every((b) => Math.abs(b.net_balance) < 0.005);
  useEffect(() => {
    if (allSettled && data?.summary.count && data.summary.count > 0) {
      // Only fire once when we transition into allSettled state during session
      const key = `expenses-celebrated-${eventId}`;
      if (!sessionStorage.getItem(key)) {
        setConfettiFire(true);
        sessionStorage.setItem(key, "1");
        void haptics.celebrate();
      }
    }
  }, [allSettled, data?.summary.count, eventId, haptics]);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Ausgabe wirklich löschen?")) return;
    await haptics.warning();
    await deleteExpense.mutateAsync({ id });
  };

  return (
    <div className="relative min-h-screen bg-[#0B0D12] text-white">
      <AmbientBg tone={tone} />
      <Confetti fire={confettiFire} onDone={() => setConfettiFire(false)} />

      {/* Header */}
      <motion.header
        style={{
          backdropFilter: `blur(${headerBlur.get()}px)`,
          WebkitBackdropFilter: `blur(${headerBlur.get()}px)`,
        }}
        className="sticky top-0 z-20 bg-[#0B0D12]/80 border-b border-white/[0.06]"
      >
        <motion.div
          style={{ opacity: headerBorderOpacity }}
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"
        />
        <div
          className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              void haptics.light();
              navigate(-1);
            }}
            className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center cursor-pointer border border-white/[0.06]"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">Ausgaben</h1>
            <p className="text-[11px] text-slate-500 truncate">{event.title}</p>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Gesamt</div>
            <div className="text-sm font-bold tracking-tight">
              <CountUp
                value={data?.summary.totalAmount ?? 0}
                currency={currency}
                className="text-white"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
          {(
            [
              { id: "list", label: "Ledger", count: data?.summary.count ?? 0 },
              { id: "settle", label: "Begleichen", count: simplifiedDebts.length },
              { id: "recurring", label: "Wiederkehrend" },
              { id: "timeline", label: "Verlauf" },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  void haptics.select();
                  setTab(t.id);
                }}
                className={cn(
                  "relative px-4 h-9 rounded-full text-xs font-semibold cursor-pointer flex-shrink-0 transition-colors flex items-center gap-1.5 overflow-hidden",
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200 bg-white/[0.03] border border-white/[0.06]",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500/30 to-cyan-500/20 border border-violet-400/50 -z-10 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span
                    className={cn(
                      "relative min-w-[18px] h-[18px] rounded-full px-1.5 text-[10px] font-black flex items-center justify-center",
                      active ? "bg-white/25 text-white" : "bg-white/[0.08] text-slate-300",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.header>

      {/* Content */}
      <main
        className="relative z-10 max-w-2xl mx-auto px-4 pt-5 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        {/* Balance card */}
        <BalanceCard
          balances={balances}
          participants={(participants ?? []).map((p) => ({ id: p.id, name: p.name ?? undefined }))}
          currentParticipantId={currentParticipantId}
          currency={currency}
          expanded={balanceExpanded}
          onToggle={() => {
            void haptics.light();
            setBalanceExpanded((v) => !v);
          }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <KpiTile label="Ausgaben" value={data?.summary.count ?? 0} format="count" accent="violet" />
          <KpiTile
            label="Offen"
            value={data?.summary.openAmount ?? 0}
            format="money"
            currency={currency}
            accent="amber"
          />
          <KpiTile
            label="Beglichen"
            value={data?.summary.settledAmount ?? 0}
            format="money"
            currency={currency}
            accent="emerald"
          />
        </div>

        {/* Tab content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {tab === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {expensesLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[72px] rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
                      />
                    ))}
                  </div>
                ) : grouped.length === 0 ? (
                  <EmptyList onAdd={() => setAddOpen(true)} />
                ) : (
                  <div className="space-y-5">
                    {grouped.map((group, groupIdx) => (
                      <motion.div
                        key={group.date}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIdx * 0.04, duration: 0.3 }}
                      >
                        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-2 px-1">
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
                              onTap={(id) => setDetailExpenseId(id)}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    <div className="text-center text-[10px] text-slate-600 pt-4">
                      Tipp: Zeile nach links wischen für Aktionen
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "settle" && eventId && (
              <motion.div
                key="settle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Offen — noch zu begleichen */}
                <section>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-bold flex items-center gap-1.5">
                      <Circle className="w-3 h-3" />
                      Noch offen ({simplifiedDebts.length})
                    </div>
                    {simplifiedDebts.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        Minimale Überweisungen
                      </span>
                    )}
                  </div>
                  <SettlementFlow
                    eventId={eventId}
                    debts={simplifiedDebts}
                    participants={(participants ?? []).map((p) => ({
                      id: p.id,
                      name: p.name ?? undefined,
                    }))}
                    currentParticipantId={currentParticipantId}
                    currency={currency}
                    onSettled={() => {
                      void haptics.success();
                    }}
                  />
                </section>

                {/* Beglichen — History */}
                <section>
                  <div className="mb-3 px-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Verlauf der Zahlungen
                    </div>
                  </div>
                  <SettledList
                    eventId={eventId}
                    participants={participants ?? []}
                    currentParticipantId={currentParticipantId}
                    currency={currency}
                  />
                </section>
              </motion.div>
            )}

            {tab === "recurring" && eventId && (
              <motion.div
                key="recurring"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <RecurringPanel
                  eventId={eventId}
                  participants={(participants ?? []).map((p) => ({
                    id: p.id,
                    user_id: p.user_id,
                    name: p.name ?? undefined,
                  }))}
                  currency={currency}
                  defaultPayerId={currentParticipantId}
                />
              </motion.div>
            )}

            {tab === "timeline" && eventId && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ActivityTimeline
                  eventId={eventId}
                  participants={participants ?? []}
                  currency={currency}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FAB */}
      {tab === "list" && eventId && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          onClick={async () => {
            await haptics.medium();
            setAddOpen(true);
          }}
          className="fixed z-30 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 shadow-[0_8px_40px_-8px_rgba(124,92,255,0.7)] flex items-center justify-center cursor-pointer"
          aria-label="Ausgabe hinzufügen"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          {/* Pulse ring */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-violet-500/30"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <Plus className="w-6 h-6 text-white relative" />
        </motion.button>
      )}

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

      {/* Expense detail drawer */}
      <ExpenseDetailSheet
        open={!!detailExpenseId}
        onClose={() => setDetailExpenseId(null)}
        expense={detailExpense}
        participants={(participants ?? []).map((p) => ({
          id: p.id,
          name: p.name ?? undefined,
        }))}
        currentParticipantId={currentParticipantId}
        currency={currency}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// KpiTile — little stat card for the strip under the balance card
// -----------------------------------------------------------------------------

function KpiTile({
  label,
  value,
  format,
  currency,
  accent,
}: {
  label: string;
  value: number;
  format: "count" | "money";
  currency?: string;
  accent: "violet" | "amber" | "emerald";
}) {
  const accentMap = {
    violet: "from-violet-500/[0.08] border-violet-500/20 text-violet-200",
    amber: "from-amber-500/[0.08] border-amber-500/20 text-amber-200",
    emerald: "from-emerald-500/[0.08] border-emerald-500/20 text-emerald-200",
  }[accent];

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 backdrop-blur-sm bg-gradient-to-br to-[#14171F]",
        accentMap,
      )}
    >
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
        {label}
      </div>
      <div className="text-sm font-bold tabular-nums tracking-tight">
        {format === "money" ? (
          <CountUp value={value} currency={currency ?? "EUR"} />
        ) : (
          <span>{value}</span>
        )}
      </div>
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative p-8 text-center rounded-3xl bg-gradient-to-br from-violet-500/[0.06] via-[#14171F] to-cyan-500/[0.04] border border-violet-500/15 overflow-hidden"
    >
      <motion.div
        aria-hidden
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", damping: 12 }}
        className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4 shadow-[0_8px_32px_-8px_rgba(124,92,255,0.6)]"
      >
        <ReceiptIcon className="w-8 h-8 text-white" />
      </motion.div>
      <h3 className="relative text-lg font-black text-white mb-1 tracking-tight">
        Noch keine Ausgaben
      </h3>
      <p className="relative text-sm text-slate-400 mb-5 max-w-xs mx-auto leading-relaxed">
        Trag die erste ein — Splits werden automatisch berechnet, Balance live aktualisiert.
      </p>
      <Button
        onClick={onAdd}
        className="relative bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-bold shadow-lg shadow-violet-500/30"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Erste Ausgabe hinzufügen
      </Button>
    </motion.div>
  );
}
