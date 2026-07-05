import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Sparkles,
  Circle,
  CheckCircle2,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useShake } from "@/hooks/useShake";
import {
  useExpensesV2,
  useBalances,
  useSimplifiedDebts,
  useDeleteExpenseV2,
  useRestoreExpenseV2,
  useExpenseCategories,
} from "@/hooks/expenses";
import type { EventData, Participant } from "@/hooks/useEvent";
import type { ExpenseCategory } from "@/lib/expenses-v2/types";
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

type Tab = "list" | "settle" | "stats" | "timeline" | "recurring";

// Lazy: recharts is heavy — load the stats panel only when the tab opens.
const ExpenseStats = lazy(() => import("@/components/expenses-v2/ExpenseStats"));

interface EventExpensesV2Props {
  /** When embedded in a dashboard, the parent passes already-loaded data so
      we skip a redundant get-event round-trip. Standalone route omits these. */
  event?: EventData | null;
  participants?: Participant[];
}

export default function EventExpensesV2({ event: eventProp, participants: participantsProp }: EventExpensesV2Props = {}) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { user } = useAuth();
  // Only fetch when the parent didn't already provide the event (deep-link route).
  const fetched = useEvent(eventProp ? undefined : slug);
  const event = eventProp ?? fetched.event;
  const participants = participantsProp ?? fetched.participants;
  const eventLoading = eventProp ? false : fetched.isLoading;

  const eventId = event?.id;
  const currency = event?.currency ?? "EUR";

  const { data: categories = [] } = useExpenseCategories(eventId);
  const categoriesById = useMemo(() => {
    const m = new Map<string, ExpenseCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  // Single mapped-participants identity so child sheets don't reset on every
  // parent re-render (a fresh inline array would wipe the add-expense form).
  const mappedParticipants = useMemo(
    () => (participants ?? []).map((p) => ({ id: p.id, name: p.name ?? undefined })),
    [participants],
  );

  const { data, isLoading: expensesLoading } = useExpensesV2(eventId);
  const { data: balances = [] } = useBalances(eventId);
  const { data: simplifiedDebts = [] } = useSimplifiedDebts(eventId);
  const deleteExpense = useDeleteExpenseV2(eventId ?? "");
  const restoreExpense = useRestoreExpenseV2(eventId ?? "");
  const lastDeletedIdRef = useRef<string | null>(null);

  const [tab, setTab] = useState<Tab>("list");
  const [addOpen, setAddOpen] = useState(false);
  const [balanceExpanded, setBalanceExpanded] = useState(false);
  const [confettiFire, setConfettiFire] = useState(false);
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null);
  const detailExpense = detailExpenseId
    ? data?.items.find((e) => e.id === detailExpenseId) ?? null
    : null;

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

  // Shake-to-undo — triggers restore on the most recent soft-deleted
  // expense. Must stay above any early return so the hook order is
  // stable across renders.
  useShake(
    () => {
      if (!lastDeletedIdRef.current) return;
      restoreExpense.mutate({ id: lastDeletedIdRef.current });
      lastDeletedIdRef.current = null;
      void haptics.medium();
    },
    { enabled: !!eventId },
  );

  if (eventLoading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    await haptics.warning();
    await deleteExpense.mutateAsync({ id });
    lastDeletedIdRef.current = id;
    // Sonner's built-in "Undo" action — lasts 10s. Shake-to-undo uses
    // the same ref so both pathways converge on one restore call.
    toast("Ausgabe gelöscht", {
      description: "Rückgängig oder schütteln, um wiederherzustellen.",
      duration: 10000,
      action: {
        label: "Rückgängig",
        onClick: () => {
          if (lastDeletedIdRef.current) {
            restoreExpense.mutate({ id: lastDeletedIdRef.current });
            lastDeletedIdRef.current = null;
            void haptics.light();
          }
        },
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AmbientBg tone={tone} />
      <Confetti fire={confettiFire} onDone={() => setConfettiFire(false)} />

      {/* Header — static blur (scroll-driven blur was janky on mobile) */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
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
            className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center cursor-pointer border border-border"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">Ausgaben</h1>
            <p className="text-[11px] text-muted-foreground truncate">{event.title}</p>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Gesamt</div>
            <div className="text-sm font-bold tracking-tight">
              <CountUp
                value={data?.summary.totalAmount ?? 0}
                currency={currency}
                className="text-foreground"
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
              { id: "stats", label: "Statistik" },
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
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground bg-muted border border-border",
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
                      active ? "bg-foreground/20 text-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main
        className="relative z-10 max-w-2xl mx-auto px-4 pt-5 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        {/* Balance card */}
        <BalanceCard
          balances={balances}
          participants={mappedParticipants}
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
                        className="h-[72px] rounded-2xl bg-muted border border-border animate-pulse"
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
                        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2 px-1">
                          {formatDateGroup(group.date)}
                        </div>
                        <div className="space-y-2">
                          {group.items.map((expense) => (
                            <ExpenseRow
                              key={expense.id}
                              expense={expense}
                              participants={mappedParticipants}
                              category={
                                (expense.category_id && categoriesById.get(expense.category_id)) ||
                                { name: expense.category, emoji: expense.emoji }
                              }
                              currentParticipantId={currentParticipantId}
                              currency={currency}
                              onTap={(id) => setDetailExpenseId(id)}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    <div className="text-center text-[10px] text-muted-foreground pt-4">
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
                      <span className="text-[10px] text-muted-foreground">
                        Minimale Überweisungen
                      </span>
                    )}
                  </div>
                  <SettlementFlow
                    eventId={eventId}
                    debts={simplifiedDebts}
                    participants={mappedParticipants}
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

            {tab === "stats" && eventId && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense
                  fallback={
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-56 rounded-2xl bg-muted border border-border animate-pulse" />
                      ))}
                    </div>
                  }
                >
                  <ExpenseStats
                    items={data?.items ?? []}
                    summary={data?.summary ?? { totalAmount: 0, settledAmount: 0, openAmount: 0, byCategoryId: {}, byPayerId: {}, count: 0 }}
                    participants={mappedParticipants}
                    categoriesById={categoriesById}
                    currency={currency}
                    budget={typeof (event?.settings as Record<string, unknown> | null)?.budget === "number"
                      ? ((event?.settings as Record<string, unknown>).budget as number)
                      : null}
                  />
                </Suspense>
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
          className="fixed z-30 right-6 w-16 h-16 rounded-full bg-primary shadow-lg shadow-black/20 flex items-center justify-center cursor-pointer"
          aria-label="Ausgabe hinzufügen"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="w-6 h-6 text-primary-foreground relative" />
        </motion.button>
      )}

      {eventId && (
        <AddExpenseSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          eventId={eventId}
          participants={mappedParticipants}
          currency={currency}
          defaultPayerId={currentParticipantId}
        />
      )}

      {/* Expense detail drawer */}
      <ExpenseDetailSheet
        open={!!detailExpenseId}
        onClose={() => setDetailExpenseId(null)}
        expense={detailExpense}
        participants={mappedParticipants}
        category={
          detailExpense
            ? (detailExpense.category_id && categoriesById.get(detailExpense.category_id)) ||
              { name: detailExpense.category, emoji: detailExpense.emoji }
            : null
        }
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
        "rounded-2xl border p-3 backdrop-blur-sm bg-gradient-to-br to-card",
        accentMap,
      )}
    >
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
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
      className="relative p-8 text-center rounded-3xl bg-gradient-to-br from-violet-500/[0.06] via-card to-cyan-500/[0.04] border border-violet-500/15 overflow-hidden"
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
      <h3 className="relative text-lg font-black text-foreground mb-1 tracking-tight">
        Noch keine Ausgaben
      </h3>
      <p className="relative text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
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
