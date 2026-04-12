/**
 * NativeEventExpenses — Expense tracking tab for the Event Dashboard.
 * Glassmorphism hero card, category breakdown, filterable expense list,
 * expandable split details, balance settlements, and add-expense FAB.
 */
import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Plus,
  Check,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem, liquidTap, duration } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NativeEventExpensesProps {
  eventSlug: string;
}

type ExpenseStatus = "paid" | "open";
type FilterTab = "alle" | "offen" | "bezahlt";
type CategoryKey = "transport" | "accommodation" | "activities" | "food" | "misc";

interface Expense {
  id: number;
  title: string;
  category: CategoryKey;
  amount: number; // cents
  paidBy: string;
  participants: number;
  perPerson: number; // cents
  status: ExpenseStatus;
  emoji: string;
}

interface CategoryInfo {
  key: CategoryKey;
  label: string;
  emoji: string;
  amount: number; // cents
  color: string;
  gradient: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number; // cents
  settled: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const eur = (cents: number) =>
  `\u20AC${(cents / 100).toFixed(2).replace(".", ",")}`;

const eurShort = (cents: number) => {
  const val = cents / 100;
  return val >= 1000
    ? `\u20AC${val.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `\u20AC${val.toFixed(2).replace(".", ",")}`;
};

const CATEGORY_COLORS: Record<CategoryKey, { color: string; gradient: string; bg: string }> = {
  transport:     { color: "text-blue-400",    gradient: "from-blue-500 to-cyan-400",     bg: "bg-blue-500/15" },
  accommodation: { color: "text-violet-400",  gradient: "from-violet-500 to-purple-400", bg: "bg-violet-500/15" },
  activities:    { color: "text-amber-400",   gradient: "from-amber-500 to-orange-400",  bg: "bg-amber-500/15" },
  food:          { color: "text-emerald-400", gradient: "from-emerald-500 to-green-400", bg: "bg-emerald-500/15" },
  misc:          { color: "text-rose-400",    gradient: "from-rose-500 to-pink-400",     bg: "bg-rose-500/15" },
};

const BORDER_LEFT: Record<CategoryKey, string> = {
  transport:     "border-l-blue-500",
  accommodation: "border-l-violet-500",
  activities:    "border-l-amber-500",
  food:          "border-l-emerald-500",
  misc:          "border-l-rose-500",
};

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_EXPENSES: Expense[] = [
  { id: 1, title: "Escape Room Buchung",  category: "activities",    amount: 10000, paidBy: "Sarah", participants: 4,  perPerson: 2500, status: "paid", emoji: "\uD83D\uDD10" },
  { id: 2, title: "Hotel 2 N\u00E4chte",  category: "accommodation", amount: 45000, paidBy: "Sarah", participants: 12, perPerson: 3750, status: "paid", emoji: "\uD83C\uDFE8" },
  { id: 3, title: "Cocktail Workshop",    category: "activities",    amount: 15600, paidBy: "Max",   participants: 4,  perPerson: 3900, status: "open", emoji: "\uD83C\uDF78" },
  { id: 4, title: "Dinner Steakhaus",     category: "food",          amount: 36000, paidBy: "Tom",   participants: 8,  perPerson: 4500, status: "open", emoji: "\uD83E\uDD69" },
  { id: 5, title: "Taxi zum Club",        category: "transport",     amount: 4500,  paidBy: "Felix", participants: 4,  perPerson: 1125, status: "paid", emoji: "\uD83D\uDE95" },
  { id: 6, title: "Club Eintritt",        category: "activities",    amount: 24000, paidBy: "Sarah", participants: 12, perPerson: 2000, status: "open", emoji: "\uD83C\uDF89" },
];

const MOCK_BUDGET = 150000; // cents

const MOCK_PARTICIPANTS = ["Sarah", "Max", "Tom", "Felix", "Lisa", "Anna", "Ben", "Lena", "Paul", "Nina", "Jan", "Mia"];

const CATEGORIES: CategoryInfo[] = [
  { key: "transport",     label: "Transport",     emoji: "\uD83D\uDE97", amount: 4500,  ...CATEGORY_COLORS.transport },
  { key: "accommodation", label: "Unterkunft",    emoji: "\uD83C\uDFE8", amount: 45000, ...CATEGORY_COLORS.accommodation },
  { key: "activities",    label: "Aktivit\u00E4ten", emoji: "\uD83C\uDFAF", amount: 49600, ...CATEGORY_COLORS.activities },
  { key: "food",          label: "Essen",         emoji: "\uD83C\uDF7D\uFE0F", amount: 36000, ...CATEGORY_COLORS.food },
  { key: "misc",          label: "Sonstiges",     emoji: "\uD83D\uDCE6", amount: 0,     ...CATEGORY_COLORS.misc },
];

const MOCK_SETTLEMENTS: Settlement[] = [
  { from: "Tom",   to: "Sarah", amount: 1500,  settled: false },
  { from: "Felix", to: "Sarah", amount: 2500,  settled: false },
  { from: "Max",   to: "Sarah", amount: 3100,  settled: true },
  { from: "Lisa",  to: "Tom",   amount: 1200,  settled: false },
];

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "alle",    label: "Alle" },
  { id: "offen",   label: "Offen" },
  { id: "bezahlt", label: "Bezahlt" },
];

/* ------------------------------------------------------------------ */
/*  Animated Counter Hook                                              */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, durationMs = 1200) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, target, {
      duration: durationMs / 1000,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(val) {
        node.textContent = eurShort(Math.round(val));
      },
    });

    return () => controls.stop();
  }, [target, durationMs]);

  return nodeRef;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function AvatarInitial({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initial = name.charAt(0).toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const dim = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

  return (
    <span
      className={cn(dim, "rounded-full flex items-center justify-center font-bold text-white shrink-0")}
      style={{ background: `hsl(${hue}, 60%, 45%)` }}
    >
      {initial}
    </span>
  );
}

function StatusBadge({ status }: { status: ExpenseStatus }) {
  const paid = status === "paid";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
        paid
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-amber-500/15 text-amber-400"
      )}
    >
      {paid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {paid ? "Bezahlt" : "Offen"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function NativeEventExpenses({ eventSlug }: NativeEventExpensesProps) {
  const haptics = useHaptics();
  const [filter, setFilter] = useState<FilterTab>("alle");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [settlements, setSettlements] = useState(MOCK_SETTLEMENTS);

  // Totals
  const totalSpent = useMemo(
    () => MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0),
    []
  );
  const perPerson = Math.round(totalSpent / MOCK_PARTICIPANTS.length);
  const budgetPct = Math.min((totalSpent / MOCK_BUDGET) * 100, 100);

  // Filtered list
  const filtered = useMemo(() => {
    if (filter === "alle") return MOCK_EXPENSES;
    return MOCK_EXPENSES.filter((e) =>
      filter === "offen" ? e.status === "open" : e.status === "paid"
    );
  }, [filter]);

  const counterRef = useAnimatedCounter(totalSpent);

  const toggleExpand = useCallback(
    (id: number) => {
      haptics.light();
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [haptics]
  );

  const toggleSettled = useCallback(
    (idx: number) => {
      haptics.medium();
      setSettlements((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, settled: !s.settled } : s))
      );
    },
    [haptics]
  );

  return (
    <div className="relative flex flex-col gap-5 pb-28">
      {/* ---- Hero Total Card ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.soft}
        className="relative overflow-hidden rounded-2xl mx-1"
      >
        {/* Glass bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/20 to-pink-500/30 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl" />

        {/* Ambient orb */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />

        <div className="relative px-5 py-6 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Gesamtausgaben
          </span>
          <span
            ref={counterRef}
            className="text-4xl font-display font-bold text-white tabular-nums"
          >
            {eurShort(0)}
          </span>
          <span className="text-sm text-white/50 mt-0.5">
            {eur(perPerson)} / Person
          </span>

          {/* Budget bar */}
          <div className="w-full mt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] text-white/50">
              <span>Budget</span>
              <span>{eurShort(totalSpent)} / {eurShort(MOCK_BUDGET)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPct}%` }}
                transition={{ duration: duration.dramatic, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  budgetPct > 90 ? "from-red-500 to-rose-400" : "from-violet-500 to-fuchsia-400"
                )}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---- Category Breakdown (horizontal scroll) ---- */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
          Kategorien
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 px-1 -mx-1">
          {CATEGORIES.map((cat, i) => {
            const pct = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
            return (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring.soft, delay: i * 0.06 }}
                className="min-w-[120px] rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 flex flex-col gap-2 shrink-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {cat.label}
                  </span>
                </div>
                <span className="text-base font-bold text-foreground">
                  {eurShort(cat.amount)}
                </span>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 + i * 0.06 }}
                    className={cn("h-full rounded-full bg-gradient-to-r", cat.gradient)}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {pct.toFixed(0)}%
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ---- Filter Tabs ---- */}
      <div className="flex gap-2 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              haptics.light();
              setFilter(tab.id);
            }}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
              filter === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- Expense List ---- */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-3 px-1"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((expense) => {
            const expanded = expandedId === expense.id;
            const catColor = CATEGORY_COLORS[expense.category];

            return (
              <motion.div
                key={expense.id}
                variants={staggerItem}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                {...liquidTap}
                onClick={() => toggleExpand(expense.id)}
                className={cn(
                  "rounded-xl bg-card/80 backdrop-blur-sm border border-border/50",
                  "border-l-[3px] cursor-pointer transition-shadow",
                  BORDER_LEFT[expense.category],
                  expanded && "shadow-lg shadow-black/10"
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Category icon */}
                  <span
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
                      catColor.bg
                    )}
                  >
                    {expense.emoji}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground leading-tight truncate">
                        {expense.title}
                      </h3>
                      <span className="text-base font-bold text-foreground whitespace-nowrap">
                        {eur(expense.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <AvatarInitial name={expense.paidBy} />
                      <span className="text-xs text-muted-foreground">
                        Bezahlt von <span className="font-medium text-foreground/80">{expense.paidBy}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {expense.participants} Personen, je {eur(expense.perPerson)}
                      </span>
                      <StatusBadge status={expense.status} />
                    </div>
                  </div>
                </div>

                {/* Expanded split details */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: duration.quick, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-border/30">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Aufteilung
                        </p>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                          {MOCK_PARTICIPANTS.slice(0, expense.participants).map((name) => (
                            <div key={name} className="flex items-center gap-2">
                              <AvatarInitial name={name} />
                              <span className="text-xs text-foreground/80 truncate flex-1">
                                {name}
                              </span>
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {eur(expense.perPerson)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Keine Ausgaben gefunden.
          </div>
        )}
      </motion.div>

      {/* ---- Balance Summary ---- */}
      <div className="px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Wer schuldet wem?
        </h2>
        <div className="flex flex-col gap-2">
          {settlements.map((s, idx) => (
            <motion.div
              key={`${s.from}-${s.to}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring.soft, delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 px-4 py-3",
                s.settled && "opacity-60"
              )}
            >
              <AvatarInitial name={s.from} size="md" />
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{s.from}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">{s.to}</span>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">
                {eur(s.amount)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSettled(idx);
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  s.settled
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Check className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---- Add Expense FAB ---- */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center z-40 px-5 pointer-events-none">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.bouncy, delay: 0.5 }}
          {...liquidTap}
          onClick={() => {
            haptics.medium();
            setShowAddForm(true);
          }}
          className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold text-sm shadow-xl shadow-violet-500/30"
        >
          <Plus className="w-5 h-5" />
          Ausgabe hinzuf\u00FCgen
        </motion.button>
      </div>

      {/* ---- Add Expense Modal ---- */}
      <AnimatePresence>
        {showAddForm && (
          <AddExpenseModal onClose={() => setShowAddForm(false)} haptics={haptics} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Expense Modal                                                  */
/* ------------------------------------------------------------------ */

interface AddExpenseModalProps {
  onClose: () => void;
  haptics: ReturnType<typeof useHaptics>;
}

function AddExpenseModal({ onClose, haptics }: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("activities");
  const [paidBy, setPaidBy] = useState(MOCK_PARTICIPANTS[0]);
  const [split, setSplit] = useState<"equal" | "custom">("equal");

  const categoryOptions: { key: CategoryKey; emoji: string; label: string }[] = [
    { key: "transport",     emoji: "\uD83D\uDE97", label: "Transport" },
    { key: "accommodation", emoji: "\uD83C\uDFE8", label: "Unterkunft" },
    { key: "activities",    emoji: "\uD83C\uDFAF", label: "Aktivit\u00E4ten" },
    { key: "food",          emoji: "\uD83C\uDF7D\uFE0F", label: "Essen" },
    { key: "misc",          emoji: "\uD83D\uDCE6", label: "Sonstiges" },
  ];

  const handleSubmit = () => {
    haptics.heavy();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: duration.quick }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring.slow}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/50 max-h-[85vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-5 pb-8 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Neue Ausgabe</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Titel
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Escape Room Buchung"
              className="h-11 rounded-xl bg-muted/40 border border-border/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          {/* Amount */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Betrag (EUR)
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                {"\u20AC"}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="h-11 w-full rounded-xl bg-muted/40 border border-border/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>
          </label>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kategorie
            </span>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setCategory(opt.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    category === opt.key
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid by */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bezahlt von
            </span>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="h-11 rounded-xl bg-muted/40 border border-border/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              {MOCK_PARTICIPANTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          {/* Split mode */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Aufteilung
            </span>
            <div className="flex gap-2">
              {(["equal", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSplit(mode)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
                    split === mode
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {mode === "equal" ? "Gleichm\u00E4\u00DFig" : "Individuell"}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            {...liquidTap}
            onClick={handleSubmit}
            className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 mt-2"
          >
            Ausgabe speichern
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
