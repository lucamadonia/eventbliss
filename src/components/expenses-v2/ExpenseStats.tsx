/**
 * ExpenseStats — the "Statistik" tab of Expenses v2. Brings back the v1
 * analytics on v2 data: budget progress, spend by category (donut), who paid
 * (bars), paid vs. share per person (grouped bars), cumulative spend over time.
 *
 * Chart rules follow the dataviz method: colors are a CVD-validated categorical
 * palette (fixed slot per category — color follows the entity), thin marks with
 * gaps, one axis, text in text tokens, legend + visible labels for identity,
 * muted grid. Dark mode uses its own validated steps, not a flipped palette.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid,
} from "recharts";
import { PiggyBank, TrendingUp, Users, HandCoins, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, ExpensesSummary, ExpenseCategory } from "@/lib/expenses-v2/types";
import { categoryKeyFromName, type CategoryAssetKey } from "@/lib/expenses-v2/category-assets";
import { CategoryIcon } from "./CategoryIcon";
import { CountUp } from "./CountUp";
import { useExpenseFormat, useCategoryName } from "./useExpenseFormat";

interface Participant {
  id: string;
  name?: string;
}

interface ExpenseStatsProps {
  items: Expense[];
  summary: ExpensesSummary;
  participants: Participant[];
  categoriesById: Map<string, ExpenseCategory>;
  currency: string;
  /** Optional planning budget from event.settings — renders the progress bar. */
  budget?: number | null;
}

// Validated categorical palette (dataviz skill reference instance) — fixed
// slot per category key; dark column = the dark-surface steps of the same hues.
const CAT_COLORS: Record<CategoryAssetKey, { light: string; dark: string }> = {
  transport:     { light: "#2a78d6", dark: "#3987e5" },
  accommodation: { light: "#1baf7a", dark: "#199e70" },
  activities:    { light: "#eda100", dark: "#c98500" },
  food:          { light: "#008300", dark: "#008300" },
  drinks:        { light: "#4a3aa7", dark: "#9085e9" },
  gifts:         { light: "#e34948", dark: "#e66767" },
  other:         { light: "#e87ba4", dark: "#d55181" },
};
const FALLBACK_COLOR = { light: "#eb6834", dark: "#d95926" }; // slot 8 (custom cats)
const SERIES_BLUE = { light: "#2a78d6", dark: "#3987e5" };
const SERIES_YELLOW = { light: "#eda100", dark: "#c98500" };
// Status colors (reserved; shipped with icon + label, never color alone)
const STATUS = { good: "#0ca30c", warning: "#fab219", critical: "#d03b3b" };

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return {
    dark,
    mode: (dark ? "dark" : "light") as "light" | "dark",
    axis: dark ? "#9ca3af" : "#6b7280",
    grid: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
  };
}

function GlassTooltip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{title}</p>
      {lines.map((l, i) => (
        <p key={i} className="text-muted-foreground">{l}</p>
      ))}
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card border border-border p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      {children}
    </section>
  );
}

export function ExpenseStats({ items, summary, participants, categoriesById, currency, budget }: ExpenseStatsProps) {
  const { t } = useTranslation();
  const fmt = useExpenseFormat(currency);
  const categoryName = useCategoryName();
  const theme = useChartTheme();
  const nameOf = useMemo(() => {
    const m = new Map(participants.map((p) => [p.id, p.name ?? "?"]));
    return (id: string) => m.get(id) ?? "?";
  }, [participants]);

  // ── Category breakdown (from summary.byCategoryId; keys may be category
  //    ids OR legacy category name strings — resolve both, merge same keys) ──
  const categoryData = useMemo(() => {
    const byKey = new Map<string, { name: string; catKey: CategoryAssetKey | null; value: number; raw: ExpenseCategory | null }>();
    for (const [id, amount] of Object.entries(summary.byCategoryId)) {
      const cat = categoriesById.get(id) ?? null;
      const rawName = cat?.name ?? (id === "uncategorized" ? null : id);
      const catKey = categoryKeyFromName(rawName);
      const display = rawName ? categoryName(rawName) : t("expenses.v2.stats.uncategorized");
      const mapKey = catKey ?? display;
      const prev = byKey.get(mapKey);
      if (prev) prev.value += amount;
      else byKey.set(mapKey, { name: display, catKey, value: amount, raw: cat });
    }
    return Array.from(byKey.values())
      .map((e) => ({
        ...e,
        color: e.catKey ? CAT_COLORS[e.catKey][theme.mode] : FALLBACK_COLOR[theme.mode],
      }))
      .sort((a, b) => b.value - a.value);
  }, [summary.byCategoryId, categoriesById, theme.mode, categoryName, t]);

  // ── Who paid ──
  const payerData = useMemo(
    () =>
      Object.entries(summary.byPayerId)
        .map(([id, value]) => ({ name: nameOf(id), value }))
        .sort((a, b) => b.value - a.value),
    [summary.byPayerId, nameOf],
  );

  // ── Paid vs. share per person ──
  const paidVsShare = useMemo(() => {
    const share = new Map<string, number>();
    for (const e of items) for (const s of e.shares ?? []) {
      share.set(s.participant_id, (share.get(s.participant_id) ?? 0) + s.amount);
    }
    const ids = new Set([...Object.keys(summary.byPayerId), ...share.keys()]);
    return Array.from(ids)
      .map((id) => ({
        name: nameOf(id),
        paid: Math.round((summary.byPayerId[id] ?? 0) * 100) / 100,
        share: Math.round((share.get(id) ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.paid - a.paid);
  }, [items, summary.byPayerId, nameOf]);

  // ── Cumulative spend over time ──
  const timeline = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of items) {
      const d = (e.expense_date ?? e.created_at).slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + e.amount);
    }
    const days = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let acc = 0;
    return days.map(([date, amount]) => {
      acc += amount;
      return {
        date,
        label: fmt.shortDate(date),
        total: Math.round(acc * 100) / 100,
      };
    });
  }, [items, fmt]);

  const budgetPct = budget && budget > 0 ? Math.min(150, (summary.totalAmount / budget) * 100) : null;
  const budgetTone = budgetPct == null ? null : budgetPct >= 100 ? "critical" : budgetPct >= 90 ? "warning" : "good";

  if (summary.count === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-8 text-center">
        <TrendingUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("expenses.v2.stats.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Budget progress (only when a planning budget is set) */}
      {budget != null && budget > 0 && budgetPct != null && (
        <Panel title={t("expenses.v2.stats.budget")} icon={PiggyBank}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-foreground tabular-nums">
              {fmt.money(summary.totalAmount)}
              <span className="text-muted-foreground font-normal">
                {" "}
                {t("expenses.v2.stats.ofBudget", { amount: fmt.money(budget) })}
              </span>
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-bold tabular-nums",
                budgetTone === "good" && "text-emerald-600 dark:text-emerald-400",
                budgetTone === "warning" && "text-amber-600 dark:text-amber-400",
                budgetTone === "critical" && "text-red-600 dark:text-red-400",
              )}
            >
              {budgetTone !== "good" && <AlertTriangle className="w-3 h-3" />}
              {Math.round((summary.totalAmount / budget) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, budgetPct)}%`,
                background: budgetTone === "critical" ? STATUS.critical : budgetTone === "warning" ? STATUS.warning : STATUS.good,
              }}
            />
          </div>
        </Panel>
      )}

      {/* Category donut + legend */}
      <Panel title={t("expenses.byCategory")} icon={TrendingUp}>
        <div className="relative">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                innerRadius={58} outerRadius={78}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <GlassTooltip
                      title={payload[0].payload.name}
                      lines={[
                        `${fmt.money(payload[0].payload.value)} · ${Math.round((payload[0].payload.value / summary.totalAmount) * 100)}%`,
                      ]}
                    />
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("expenses.total")}
            </span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              <CountUp value={summary.totalAmount} currency={currency} />
            </span>
          </div>
        </div>
        {/* Legend — visible labels + amounts (identity never color-alone) */}
        <ul className="mt-2 space-y-1.5">
          {categoryData.map((c) => (
            <li key={c.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: c.color }} />
              <CategoryIcon category={c.raw ?? { name: c.name }} size="row" className="w-5 h-5" />
              <span className="min-w-0 flex-1 truncate text-foreground/90">{c.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {fmt.money(c.value)} · {Math.round((c.value / summary.totalAmount) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Who paid */}
      <Panel title={t("expenses.whoPaid")} icon={HandCoins}>
        <ResponsiveContainer width="100%" height={Math.max(120, payerData.length * 38)}>
          <BarChart data={payerData} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="name" width={88}
              tickLine={false} axisLine={false}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: theme.grid }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <GlassTooltip title={String(payload[0].payload.name)} lines={[fmt.money(Number(payload[0].value))]} />
                ) : null
              }
            />
            <Bar
              dataKey="value" barSize={14} radius={[0, 4, 4, 0]}
              fill={SERIES_BLUE[theme.mode]} isAnimationActive={false}
              label={{ position: "right", fill: theme.axis, fontSize: 11, formatter: (v: number) => fmt.money(v) }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* Paid vs. share */}
      <Panel title={t("expenses.v2.stats.paidVsShare")} icon={Users}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={paidVsShare} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: theme.axis, fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: theme.grid }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <GlassTooltip
                    title={String(label)}
                    lines={payload.map(
                      (p) =>
                        `${p.name === "paid" ? t("expenses.v2.stats.paid") : t("expenses.v2.stats.share")}: ${fmt.money(Number(p.value))}`,
                    )}
                  />
                ) : null
              }
            />
            <Bar dataKey="paid" barSize={12} radius={[4, 4, 0, 0]} fill={SERIES_BLUE[theme.mode]} isAnimationActive={false} />
            <Bar dataKey="share" barSize={12} radius={[4, 4, 0, 0]} fill={SERIES_YELLOW[theme.mode]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
        {/* Legend (2 series) — swatch + text token, not colored text */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIES_BLUE[theme.mode] }} />{" "}
            {t("expenses.v2.stats.paid")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SERIES_YELLOW[theme.mode] }} />{" "}
            {t("expenses.v2.stats.share")}
          </span>
        </div>
      </Panel>

      {/* Cumulative timeline (needs ≥ 2 days) */}
      {timeline.length >= 2 && (
        <Panel title={t("expenses.v2.stats.trend")} icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={timeline} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="stats-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_BLUE[theme.mode]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={SERIES_BLUE[theme.mode]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={theme.grid} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: theme.axis, fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <GlassTooltip
                      title={String(label)}
                      lines={[t("expenses.v2.stats.totalLine", { amount: fmt.money(Number(payload[0].value)) })]}
                    />
                  ) : null
                }
              />
              <Area
                type="monotone" dataKey="total"
                stroke={SERIES_BLUE[theme.mode]} strokeWidth={2}
                fill="url(#stats-area)" isAnimationActive={false}
                dot={false} activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}

export default ExpenseStats;
