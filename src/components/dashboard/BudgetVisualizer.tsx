import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Wallet, TrendingUp } from "lucide-react";

interface BudgetVisualizerProps {
  /** Raw markdown body of the budget section */
  body: string;
  /** Optional participant count to show per-person estimates */
  participantCount?: number;
}

interface DayBudget {
  label: string;
  amount: number;
  emoji: string;
  gradient: string;
  breakdown?: string;
}

// Cycles deterministically so days keep consistent colors
const DAY_GRADIENTS = [
  "from-purple-600 to-pink-600",
  "from-pink-600 to-amber-500",
  "from-amber-500 to-red-600",
  "from-emerald-500 to-teal-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-violet-600",
];

const DAY_EMOJIS = ["🎉", "🌲", "🎲", "🥐", "🍾", "🌅"];

/**
 * Parses lines like:
 *   **Day 1:** Brewery (€25) + Dinner/Pub Crawl (€90) = €115
 *   - **Day 2:** Outdoor (€85) + Regroup (€10) + Evening (€75) = €170
 * And captures the final total in amounts like "= €115".
 */
function parseBudget(body: string): { days: DayBudget[]; total: number; notes: string[] } {
  const days: DayBudget[] = [];
  const notes: string[] = [];
  const lines = body.split(/\n+/);

  const dayRegex = /(?:^|\s)(?:\*\*)?\s*(?:Day|Tag|Día|Dia|Jour|Giorno|Dag|Dzień|Gün)\s*(\d+)(?:\*\*)?\s*[:\-–]\s*(.+?)(?:=\s*[€$]?\s*([\d.,]+))?$/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(dayRegex);
    if (m) {
      const num = parseInt(m[1], 10);
      const breakdown = (m[2] || "").replace(/\*\*/g, "").trim();
      const amount = m[3] ? parseFloat(m[3].replace(",", ".")) : sumEurosInLine(breakdown);
      days.push({
        label: `Day ${num}`,
        amount: Math.round(amount),
        emoji: DAY_EMOJIS[(num - 1) % DAY_EMOJIS.length],
        gradient: DAY_GRADIENTS[(num - 1) % DAY_GRADIENTS.length],
        breakdown,
      });
      continue;
    }
    // Any "TOTAL" / "Gesamtkosten" line → captured as note
    if (/(total|gesamt|summe|somme|totale)/i.test(line)) {
      notes.push(line.replace(/\*\*/g, "").replace(/^[-*\s]+/, "").trim());
    }
  }

  const total = days.reduce((sum, d) => sum + d.amount, 0);
  return { days, total, notes };
}

function sumEurosInLine(text: string): number {
  const matches = text.match(/€\s*([\d.,]+)/g) || [];
  return matches.reduce((sum, m) => {
    const n = parseFloat(m.replace(/[€\s]/g, "").replace(",", "."));
    return isNaN(n) ? sum : sum + n;
  }, 0);
}

export default function BudgetVisualizer({ body, participantCount }: BudgetVisualizerProps) {
  const { t } = useTranslation();
  const { days, total, notes } = useMemo(() => parseBudget(body), [body]);

  // Fallback: if we couldn't parse any day lines, bail and let markdown render
  if (days.length === 0) return null;

  const perPerson = participantCount && participantCount > 0 ? Math.round(total / participantCount) : null;

  return (
    <div className="space-y-5">
      {/* Header row: total number */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white/70 uppercase tracking-wider">
          <Wallet className="w-3.5 h-3.5" />
          {t("dashboard.ai.budgetByDay", "Budget pro Tag")}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">
            {t("dashboard.ai.totalEstimate", "Geschätzte Gesamtkosten")}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent leading-none tabular-nums"
          >
            €{total}
          </motion.div>
          {perPerson !== null && (
            <div className="text-[11px] text-white/55 mt-1">
              ≈ €{perPerson} {t("dashboard.ai.perPerson", "pro Person")}
            </div>
          )}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-white/5 flex">
        {days.map((d, i) => {
          const width = total > 0 ? (d.amount / total) * 100 : 0;
          return (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: `${width}%`, transformOrigin: "left center" }}
              className={`h-full bg-gradient-to-r ${d.gradient}`}
              title={`${d.label}: €${d.amount}`}
            />
          );
        })}
      </div>

      {/* Per-day rows */}
      <div className="space-y-2">
        {days.map((d, i) => {
          const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${d.gradient} flex items-center justify-center text-lg shadow-md`}>
                {d.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-sm">{d.label}</div>
                {d.breakdown && (
                  <div className="text-[11px] text-muted-foreground truncate">{d.breakdown}</div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-foreground text-base tabular-nums">€{d.amount}</div>
                <div className="text-[10px] text-muted-foreground tabular-nums">{pct}%</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Notes (total line, quick-note, etc) */}
      {notes.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-100/90 leading-relaxed space-y-1">
            {notes.map((n, i) => <div key={i}>{n}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
