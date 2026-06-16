/**
 * NativeEventExpenses — Expense tracking tab for the Event Dashboard.
 * Glassmorphism hero card, category breakdown, filterable expense list,
 * expandable split details, balance settlements, and add-expense FAB.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, animate } from "framer-motion";
import {
  Plus,
  Check,
  Clock,
  ArrowRight,
  X,
  Loader2,
  ScanLine,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem, liquidTap, duration } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ReceiptAttach } from "@/components/expenses-v2/ReceiptAttach";
import { useReceiptUpload } from "@/hooks/expenses/useExpenseExtras";
import type { ReceiptOcrResult } from "@/lib/expenses-v2/types";
import { takePhoto } from "@/lib/camera";
import { isNative } from "@/lib/platform";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NativeEventExpensesProps {
  eventSlug: string;
}

type ExpenseStatus = "paid" | "open";
type FilterTab = "alle" | "offen" | "bezahlt";
type CategoryKey = "transport" | "accommodation" | "activities" | "food" | "drinks" | "gifts" | "other";

interface ExpenseShare {
  name: string;
  amount: number; // cents
  paid: boolean;
}

interface Expense {
  id: string;
  title: string;
  category: CategoryKey;
  amount: number; // cents
  paidBy: string;
  participants: number;
  perPerson: number; // cents
  status: ExpenseStatus;
  emoji: string;
  shares: ExpenseShare[];
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
  drinks:        { color: "text-sky-400",     gradient: "from-sky-500 to-blue-400",      bg: "bg-sky-500/15" },
  gifts:         { color: "text-pink-400",    gradient: "from-pink-500 to-rose-400",     bg: "bg-pink-500/15" },
  other:         { color: "text-rose-400",    gradient: "from-rose-500 to-pink-400",     bg: "bg-rose-500/15" },
};

const BORDER_LEFT: Record<CategoryKey, string> = {
  transport:     "border-l-blue-500",
  accommodation: "border-l-violet-500",
  activities:    "border-l-amber-500",
  food:          "border-l-emerald-500",
  drinks:        "border-l-sky-500",
  gifts:         "border-l-pink-500",
  other:         "border-l-rose-500",
};

const CATEGORY_LABELS: Record<CategoryKey, { label: string; emoji: string }> = {
  transport:     { label: "Transport",    emoji: "\uD83D\uDE97" },
  accommodation: { label: "Unterkunft",   emoji: "\uD83C\uDFE8" },
  activities:    { label: "Aktivitäten", emoji: "\uD83C\uDFAF" },
  food:          { label: "Essen",        emoji: "\uD83C\uDF7D\uFE0F" },
  drinks:        { label: "Getränke", emoji: "\uD83C\uDF7A" },
  gifts:         { label: "Geschenke",    emoji: "\uD83C\uDF81" },
  other:         { label: "Sonstiges",    emoji: "\uD83D\uDCCC" },
};

function getCategoryEmoji(cat: string | null): string {
  const map: Record<string, string> = {
    transport: "\uD83D\uDE95", accommodation: "\uD83C\uDFE8", activities: "\uD83C\uDFAF",
    food: "\uD83C\uDF55", drinks: "\uD83C\uDF7A", gifts: "\uD83C\uDF81", other: "\uD83D\uDCCC",
  };
  return map[cat || "other"] || "\uD83D\uDCCC";
}

// Heuristic category suggestion from OCR (no AI): match merchant + line items
// against keyword buckets. Falls back to "activities" (the form default).
const CATEGORY_KEYWORDS: Record<Exclude<CategoryKey, "other">, string[]> = {
  food: ["restaurant", "pizz", "burger", "kebab", "sushi", "caf\u00E9", "cafe", "bistro", "food", "b\u00E4ckerei", "bakery", "diner", "grill", "ristorante", "trattoria", "mcdonald", "imbiss", "lebensmittel", "supermarkt", "rewe", "edeka", "aldi", "lidl", "spar", "carrefour", "mercadona"],
  drinks: ["bar", "pub", "club", "beer", "bier", "wine", "vino", "cocktail", "brauerei", "brewery", "getr\u00E4nke", "drinks", "lounge", "kneipe"],
  accommodation: ["hotel", "hostel", "airbnb", "booking", "pension", "apartment", "resort", "\u00FCbernachtung", "zimmer", "lodge", "motel"],
  transport: ["taxi", "uber", "bolt", "bahn", "train", "flug", "flight", "airline", "ryanair", "easyjet", "lufthansa", "tank", "fuel", "shell", "aral", "esso", "benzin", "parking", "parkhaus", "metro", "bus", "transfer", "mietwagen", "rental"],
  activities: ["ticket", "escape", "tour", "museum", "kart", "paintball", "bowling", "eintritt", "event", "show", "experience", "aktivit\u00E4t", "rafting", "spa", "golf", "boat", "boot"],
  gifts: ["gift", "geschenk", "blumen", "flower", "souvenir"],
};

function suggestCategory(ocr: ReceiptOcrResult | null): CategoryKey {
  if (!ocr) return "activities";
  const hay = [ocr.merchant ?? "", ...(ocr.line_items ?? []).map((li) => li.label)]
    .join(" ")
    .toLowerCase();
  if (!hay.trim()) return "activities";
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => hay.includes(w))) return cat as CategoryKey;
  }
  return "other";
}

// Convert a Capacitor camera webPath (or any fetchable URI) into a File for upload.
async function uriToFile(uri: string): Promise<File> {
  const res = await fetch(uri);
  const blob = await res.blob();
  const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  return new File([blob], `receipt-${Date.now()}.${ext}`, { type: blob.type || "image/jpeg" });
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "alle",    label: "Alle" },
  { id: "offen",   label: "Offen" },
  { id: "bezahlt", label: "Bezahlt" },
];

// Stable fallbacks so memo dependencies don't churn while the query loads
const EMPTY_PARTICIPANTS: { id: string; name: string }[] = [];
const EMPTY_RAW_EXPENSES: any[] = [];

// Compute simplified settlements from expense data: figure out who owes whom
function computeSettlements(rawExpenses: any[], pMap: Map<string, string>, guestLabel: string): Settlement[] {
  // Net balance per participant: positive = owed money, negative = owes money
  const balances = new Map<string, number>();

  rawExpenses.forEach(e => {
    const paidById = e.paid_by_participant_id;
    if (!paidById) return;
    const amountCents = Math.round((e.amount || 0) * 100);

    // The payer is owed the full amount
    balances.set(paidById, (balances.get(paidById) || 0) + amountCents);

    // Each share participant owes their share
    (e.expense_shares || []).forEach((s: any) => {
      const shareCents = Math.round((s.amount || 0) * 100);
      balances.set(s.participant_id, (balances.get(s.participant_id) || 0) - shareCents);
    });
  });

  // Simplify debts
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  balances.forEach((amount, id) => {
    if (amount < -50) debtors.push({ id, amount: -amount }); // owes money
    if (amount > 50) creditors.push({ id, amount }); // owed money
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const newSettlements: Settlement[] = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transfer > 50) {
      newSettlements.push({
        from: pMap.get(debtors[di].id) || guestLabel,
        to: pMap.get(creditors[ci].id) || guestLabel,
        amount: transfer,
        settled: false,
      });
    }
    debtors[di].amount -= transfer;
    creditors[ci].amount -= transfer;
    if (debtors[di].amount < 50) di++;
    if (creditors[ci].amount < 50) ci++;
  }

  return newSettlements;
}

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
  const { t } = useTranslation();
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
      {paid ? t("nativeExtra.expenses.statusPaid", "Bezahlt") : t("nativeExtra.expenses.statusOpen", "Offen")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function NativeEventExpenses({ eventSlug }: NativeEventExpensesProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>("alle");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  // Locally toggled "settled" checkmarks (by settlement index)
  const [settledKeys, setSettledKeys] = useState<Set<number>>(() => new Set());

  // Fetch real data from Supabase (cached via TanStack Query)
  const { data: expensesData, isLoading: loading } = useQuery({
    queryKey: ["native-expenses", eventSlug],
    queryFn: async () => {
      // Get event ID from slug
      const { data: eventData } = await supabase
        .from("events").select("id, settings").eq("slug", eventSlug).single();
      if (!eventData) {
        return {
          eventId: null as string | null,
          budget: 0,
          participants: EMPTY_PARTICIPANTS,
          raw: EMPTY_RAW_EXPENSES,
        };
      }
      // Budget may be stored in settings JSON
      const settings = eventData.settings as Record<string, any> | null;
      const budget = Math.round(((settings?.budget as number) || 0) * 100);

      // Fetch participants for name mapping
      const { data: parts } = await supabase
        .from("participants").select("id, name").eq("event_id", eventData.id);

      // Fetch expenses with shares
      const { data } = await supabase
        .from("expenses")
        .select("*, expense_shares(*)")
        .eq("event_id", eventData.id)
        .is("deleted_at", null)
        .order("expense_date", { ascending: false });

      return {
        eventId: eventData.id as string | null,
        budget,
        participants: (parts || []).map(p => ({ id: p.id, name: p.name })),
        raw: (data || []) as any[],
      };
    },
  });

  const eventId = expensesData?.eventId ?? null;
  const budget = expensesData?.budget ?? 0; // cents
  const participantList = expensesData?.participants ?? EMPTY_PARTICIPANTS;
  const rawExpenses = expensesData?.raw ?? EMPTY_RAW_EXPENSES;

  const participantMap = useMemo(() => {
    const pMap = new Map<string, string>();
    participantList.forEach(p => pMap.set(p.id, p.name));
    return pMap;
  }, [participantList]);

  const expenses = useMemo<Expense[]>(() => rawExpenses.map(e => {
    const cat = (e.category || "other") as CategoryKey;
    const sharesCount = e.expense_shares?.length || 1;
    return {
      id: e.id,
      title: e.description || t("nativeExtra.expenses.defaultTitle", "Ausgabe"),
      category: cat,
      amount: Math.round((e.amount || 0) * 100),
      paidBy: participantMap.get(e.paid_by_participant_id || "") || t("nativeExtra.expenses.unknownPayer", "Unbekannt"),
      participants: sharesCount,
      perPerson: Math.round(((e.amount || 0) * 100) / sharesCount),
      status: (e.expense_shares?.every((s: any) => s.is_paid) ? "paid" : "open") as ExpenseStatus,
      emoji: getCategoryEmoji(e.category),
      shares: (e.expense_shares || []).map((s: any) => ({
        name: participantMap.get(s.participant_id) || t("nativeExtra.expenses.guest", "Gast"),
        amount: Math.round((s.amount || 0) * 100),
        paid: !!s.is_paid,
      })),
    };
  }), [rawExpenses, participantMap, t]);

  // Settlements: memoized O(n²) computation over the raw expense data
  const baseSettlements = useMemo(
    () => computeSettlements(rawExpenses, participantMap, t("nativeExtra.expenses.guest", "Gast")),
    [rawExpenses, participantMap, t]
  );

  // Reset local "settled" toggles whenever the underlying data changes
  useEffect(() => { setSettledKeys(new Set()); }, [baseSettlements]);

  const settlements = useMemo<Settlement[]>(
    () => settledKeys.size === 0
      ? baseSettlements
      : baseSettlements.map((s, i) => (settledKeys.has(i) ? { ...s, settled: true } : s)),
    [baseSettlements, settledKeys]
  );

  // Totals
  const totalCents = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const participantCount = participantMap.size || 1;
  const perPersonCents = Math.round(totalCents / participantCount);
  const budgetPct = budget > 0 ? Math.min((totalCents / budget) * 100, 100) : 0;

  // Category breakdown (computed from real data)
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return [...map.entries()]
      .map(([cat, amount]) => ({
        key: cat as CategoryKey,
        label: t(`nativeExtra.expenses.cat.${cat}`, CATEGORY_LABELS[cat as CategoryKey]?.label || cat),
        emoji: CATEGORY_LABELS[cat as CategoryKey]?.emoji || getCategoryEmoji(cat),
        amount,
        percentage: totalCents > 0 ? Math.round((amount / totalCents) * 100) : 0,
        ...CATEGORY_COLORS[cat as CategoryKey] || CATEGORY_COLORS.other,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalCents, t]);

  // Filtered list
  const filtered = useMemo(() => {
    if (filter === "alle") return expenses;
    return expenses.filter((e) =>
      filter === "offen" ? e.status === "open" : e.status === "paid"
    );
  }, [filter, expenses]);

  const counterRef = useAnimatedCounter(totalCents);

  const toggleExpand = useCallback(
    (id: string) => {
      haptics.light();
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [haptics]
  );

  const toggleSettled = useCallback(
    (idx: number) => {
      haptics.medium();
      setSettledKeys((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        return next;
      });
    },
    [haptics]
  );

  const refetchExpenses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["native-expenses", eventSlug] });
  }, [queryClient, eventSlug]);

  if (loading) {
    return (
      <div className="relative flex flex-col gap-5 pb-28">
        {/* Loading skeleton */}
        <div className="relative overflow-hidden rounded-2xl mx-1">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/20 to-pink-500/30 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl" />
          <div className="relative px-5 py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            <span className="text-sm text-white/50">{t("nativeExtra.expenses.loading", "Ausgaben werden geladen...")}</span>
          </div>
        </div>
        {/* Skeleton cards */}
        {[1, 2, 3].map(i => (
          <div key={i} className="mx-1 rounded-xl bg-card/40 backdrop-blur-sm border border-border/30 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

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
            {t("nativeExtra.expenses.totalSpent", "Gesamtausgaben")}
          </span>
          <span
            ref={counterRef}
            className="text-4xl font-display font-bold text-white tabular-nums"
          >
            {eurShort(0)}
          </span>
          <span className="text-sm text-white/50 mt-0.5">
            {eur(perPersonCents)} {t("nativeExtra.expenses.perPerson", "/ Person")}
          </span>

          {/* Budget bar */}
          {budget > 0 && (
          <div className="w-full mt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] text-white/50">
              <span>{t('nativeExtra.budget')}</span>
              <span>{eurShort(totalCents)} / {eurShort(budget)}</span>
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
          )}
        </div>
      </motion.div>

      {/* ---- Category Breakdown (horizontal scroll) ---- */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
          {t("nativeExtra.expenses.categories", "Kategorien")}
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 px-1 -mx-1">
          {categoryTotals.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 px-2">{t("nativeExtra.expenses.noneYet", "Noch keine Ausgaben.")}</div>
          ) : categoryTotals.map((cat, i) => (
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
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 + i * 0.06 }}
                  className={cn("h-full rounded-full bg-gradient-to-r", cat.gradient)}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {cat.percentage}%
              </span>
            </motion.div>
          ))}
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
            {t(
              tab.id === "alle"
                ? "nativeExtra.expenses.filterAll"
                : tab.id === "offen"
                ? "nativeExtra.expenses.filterOpen"
                : "nativeExtra.expenses.filterPaid",
              tab.label,
            )}
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
                        {t("nativeExtra.expenses.paidBy", "Bezahlt von")} <span className="font-medium text-foreground/80">{expense.paidBy}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {t("nativeExtra.expenses.peopleEach", "{{count}} Personen, je {{amount}}", { count: expense.participants, amount: eur(expense.perPerson) })}
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
                          {t("nativeExtra.expenses.split", "Aufteilung")}
                        </p>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                          {expense.shares.map((share) => (
                            <div key={share.name} className="flex items-center gap-2">
                              <AvatarInitial name={share.name} />
                              <span className="text-xs text-foreground/80 truncate flex-1">
                                {share.name}
                              </span>
                              <span className={cn(
                                "text-xs font-semibold tabular-nums",
                                share.paid ? "text-emerald-400" : "text-foreground"
                              )}>
                                {eur(share.amount)}
                              </span>
                              {share.paid && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
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
            {t("nativeExtra.expenses.noneFound", "Keine Ausgaben gefunden.")}
          </div>
        )}
      </motion.div>

      {/* ---- Balance Summary ---- */}
      {settlements.length > 0 && (
      <div className="px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("nativeExtra.expenses.whoOwes", "Wer schuldet wem?")}
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
      )}

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
          {t("nativeExtra.expenses.add", "Ausgabe hinzufügen")}
        </motion.button>
      </div>

      {/* ---- Add Expense Modal ---- */}
      <AnimatePresence>
        {showAddForm && eventId && (
          <AddExpenseModal
            onClose={() => setShowAddForm(false)}
            haptics={haptics}
            eventId={eventId}
            participants={participantList}
            onSaved={refetchExpenses}
          />
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
  eventId: string;
  participants: { id: string; name: string }[];
  onSaved: () => void;
}

function AddExpenseModal({ onClose, haptics, eventId, participants, onSaved }: AddExpenseModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState<CategoryKey>("activities");
  const [paidBy, setPaidBy] = useState(participants[0]?.id || "");
  const [split, setSplit] = useState<"equal" | "custom">("equal");
  const [saving, setSaving] = useState(false);

  // Receipt scanner state
  const receiptUpload = useReceiptUpload();
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [ocr, setOcr] = useState<ReceiptOcrResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  // Per-participant amounts for custom split (string inputs in major units)
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  // Upload + OCR a chosen/captured receipt image
  const runScan = async (file: File | null) => {
    if (!file) {
      setReceiptPreview(null);
      setOcr(null);
      setStoragePath(null);
      return;
    }
    setReceiptPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const { storagePath: path, ocr: result } = await receiptUpload.mutateAsync({
        eventId,
        file,
        dispatchOcr: true,
      });
      setStoragePath(path);
      setOcr(result);
      if (result) applyOcr(result);
    } catch {
      // upload/OCR errors surface via the hook's toast; keep manual entry usable
    } finally {
      setScanning(false);
    }
  };

  // Native (iOS/Android): use the Capacitor camera (camera/gallery prompt)
  const captureNative = async () => {
    await haptics.medium();
    const uri = await takePhoto();
    if (!uri) return;
    try {
      const file = await uriToFile(uri);
      await runScan(file);
    } catch {
      /* ignore — manual entry remains */
    }
  };

  // Pre-fill the form from an OCR result (all fields stay editable)
  const applyOcr = (r: ReceiptOcrResult) => {
    if (r.merchant) setTitle((prev) => prev || r.merchant!);
    if (r.total != null) setAmount(String(r.total).replace(".", ","));
    if (r.currency) setCurrency(r.currency);
    if (r.date) setExpenseDate(r.date);
    setCategory(suggestCategory(r));
    haptics.light();
  };

  const categoryOptions: { key: CategoryKey; emoji: string; label: string }[] = [
    { key: "transport",     emoji: "\uD83D\uDE97", label: t("nativeExtra.expenses.cat.transport", "Transport") },
    { key: "accommodation", emoji: "\uD83C\uDFE8", label: t("nativeExtra.expenses.cat.accommodation", "Unterkunft") },
    { key: "activities",    emoji: "\uD83C\uDFAF", label: t("nativeExtra.expenses.cat.activities", "Aktivitäten") },
    { key: "food",          emoji: "\uD83C\uDF7D\uFE0F", label: t("nativeExtra.expenses.cat.food", "Essen") },
    { key: "drinks",        emoji: "\uD83C\uDF7A", label: t("nativeExtra.expenses.cat.drinks", "Getränke") },
    { key: "gifts",         emoji: "\uD83C\uDF81", label: t("nativeExtra.expenses.cat.gifts", "Geschenke") },
    { key: "other",         emoji: "\uD83D\uDCCC", label: t("nativeExtra.expenses.cat.other", "Sonstiges") },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !amount.trim() || !paidBy) return;
    setSaving(true);

    const amountNum = parseFloat(amount.replace(",", "."));
    if (isNaN(amountNum) || amountNum <= 0) { setSaving(false); return; }

    // If no paidBy selected, try to get current user's participant
    let paidById = paidBy;
    if (!paidById) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myP } = await supabase
          .from("participants").select("id").eq("event_id", eventId)
          .eq("user_id", user.id).single();
        if (myP) paidById = myP.id;
      }
    }

    const hasReceipt = !!ocr || !!storagePath;
    const receiptJson = hasReceipt ? { ...(ocr ?? {}), _storage_path: storagePath } : null;

    // Insert expense
    const { data: newExpense, error } = await supabase.from("expenses").insert({
      event_id: eventId,
      description: title.trim(),
      amount: amountNum,
      category,
      paid_by_participant_id: paidById || null,
      split_type: split,
      currency: currency || "EUR",
      expense_date: expenseDate || null,
      created_via: hasReceipt ? "camera" : "manual",
      receipt_ocr_json: receiptJson,
    } as any).select("id").single();

    // Create shares
    if (!error && newExpense && participants.length > 0) {
      let shares: { expense_id: string; participant_id: string; amount: number; is_paid: boolean }[];
      if (split === "custom") {
        shares = participants.map(p => ({
          expense_id: newExpense.id,
          participant_id: p.id,
          amount: Math.round((parseFloat((customShares[p.id] ?? "").replace(",", ".")) || 0) * 100) / 100,
          is_paid: false,
        })).filter(s => s.amount > 0);
      } else {
        const shareAmount = amountNum / participants.length;
        shares = participants.map(p => ({
          expense_id: newExpense.id,
          participant_id: p.id,
          amount: Math.round(shareAmount * 100) / 100,
          is_paid: false,
        }));
      }
      if (shares.length > 0) {
        await supabase.from("expense_shares").insert(shares);
      }
    }

    setSaving(false);
    haptics.heavy();
    onSaved();
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border/50 max-h-[85vh] overflow-y-auto native-scroll"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-5 pb-8 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t('nativeExtra.newExpense')}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Receipt scanner */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("nativeExtra.receipt.scanReceipt", "Beleg scannen")}
            </span>
            {receiptPreview || scanning ? (
              <ReceiptAttach
                previewUrl={receiptPreview}
                ocr={ocr}
                isScanning={scanning}
                onOcr={applyOcr}
                onFile={runScan}
                compact
              />
            ) : isNative() ? (
              <motion.button
                type="button"
                {...liquidTap}
                onClick={captureNative}
                className="h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-400/25 flex items-center justify-center gap-2"
              >
                <ScanLine className="w-4 h-4 text-violet-200" />
                <span className="text-sm font-semibold text-violet-100">
                  {t("nativeExtra.receipt.scanReceipt", "Beleg scannen")}
                </span>
              </motion.button>
            ) : (
              <ReceiptAttach onOcr={applyOcr} onFile={runScan} compact />
            )}
          </div>

          {/* Title */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("nativeExtra.expenses.fieldTitle", "Titel")}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("nativeExtra.expenses.titlePlaceholder", "z.B. Escape Room Buchung")}
              className="h-11 rounded-xl bg-muted/40 border border-border/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          {/* Amount */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("nativeExtra.expenses.amountLabel", "Betrag")} ({currency})
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
                placeholder={t("nativeExtra.expenses.amountPlaceholder", "0,00")}
                className="h-11 w-full rounded-xl bg-muted/40 border border-border/50 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>
          </label>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("nativeExtra.expenses.categoryLabel", "Kategorie")}
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
              {t("nativeExtra.expenses.paidBy", "Bezahlt von")}
            </span>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="h-11 rounded-xl bg-muted/40 border border-border/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          {/* Split mode */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("nativeExtra.expenses.split", "Aufteilung")}
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
                  {mode === "equal" ? t("nativeExtra.expenses.splitEqual", "Gleichmäßig") : t("nativeExtra.expenses.splitCustom", "Individuell")}
                </button>
              ))}
            </div>

            {/* Custom split: per-participant amounts */}
            <AnimatePresence initial={false}>
              {split === "custom" && participants.length > 0 && (() => {
                const total = parseFloat(amount.replace(",", ".")) || 0;
                const equalShare = total > 0 ? (total / participants.length).toFixed(2) : "";
                const sum = participants.reduce(
                  (acc, p) => acc + (parseFloat((customShares[p.id] ?? "").replace(",", ".")) || 0),
                  0,
                );
                const balanced = Math.abs(sum - total) < 0.01;
                return (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 pt-2">
                      {participants.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <AvatarInitial name={p.name} />
                          <span className="flex-1 text-sm text-foreground truncate">{p.name}</span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{"€"}</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={customShares[p.id] ?? ""}
                              onChange={(e) => setCustomShares((s) => ({ ...s, [p.id]: e.target.value }))}
                              placeholder={equalShare}
                              className="h-9 w-full rounded-lg bg-muted/40 border border-border/50 pl-6 pr-2 text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>
                      ))}
                      <span className={cn("text-[11px] tabular-nums", balanced ? "text-emerald-400" : "text-amber-400")}>
                        {eur(Math.round(sum * 100))} / {eur(Math.round(total * 100))}
                      </span>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <motion.button
            {...liquidTap}
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !amount.trim()}
            className={cn(
              "h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 mt-2 flex items-center justify-center gap-2",
              (saving || !title.trim() || !amount.trim()) && "opacity-50 pointer-events-none"
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? t("nativeExtra.expenses.saving", "Wird gespeichert...") : t("nativeExtra.expenses.save", "Ausgabe speichern")}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
