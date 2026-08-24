/**
 * SceneExpenses — Folie 4: Ausgaben splitten, Salden gleichen sich aus.
 * Die Gesamtsumme zaehlt beim Erscheinen hoch (bei Bewegungsarmut steht sie
 * sofort auf dem Zielwert), darunter die Kategorie-Verteilung und ein
 * "ausgeglichen"-Badge als Ziel der Reise.
 */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sceneMotion } from "./onboarding-data";

const TARGET_TOTAL = 478.5;
const PARTICIPANTS = 6;

const CATEGORIES = [
  { key: "catTransport", color: "#8b5cf6", pct: 18 },
  { key: "catFood", color: "#f59e0b", pct: 33 },
  { key: "catFun", color: "#22d3ee", pct: 25 },
  { key: "catDrinks", color: "#ec4899", pct: 24 },
] as const;

export function SceneExpenses() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { stagger, item } = sceneMotion(!!reduce);
  const [total, setTotal] = useState(reduce ? TARGET_TOTAL : 0);

  useEffect(() => {
    if (reduce) return;
    const steps = 30;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTotal(Math.min(TARGET_TOTAL, (TARGET_TOTAL / steps) * i));
      if (i >= steps) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="w-full rounded-3xl bg-card border border-border p-4 shadow-lg"
    >
      <div className="grid grid-cols-2 gap-2 mb-3">
        <motion.div variants={item} className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">
            {t("native.onboarding.scene.expenses.totalLabel")}
          </div>
          <div className="text-lg font-bold text-amber-500 tabular-nums">€{total.toFixed(2)}</div>
        </motion.div>
        <motion.div variants={item} className="rounded-2xl bg-muted/30 border border-border p-3 text-center">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">
            {t("native.onboarding.scene.expenses.perPersonLabel")}
          </div>
          <div className="text-lg font-bold text-foreground tabular-nums">
            €{(total / PARTICIPANTS).toFixed(2)}
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex h-2 rounded-full overflow-hidden mb-2">
        {CATEGORIES.map((c) => (
          <div key={c.key} style={{ width: `${c.pct}%`, background: c.color }} />
        ))}
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground mb-3">
        {CATEGORIES.map((c) => (
          <span key={c.key} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
            {t(`native.onboarding.scene.expenses.${c.key}`)}
          </span>
        ))}
      </motion.div>

      <motion.div
        variants={item}
        className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
        {t("native.onboarding.scene.expenses.settledLabel")}
      </motion.div>
    </motion.div>
  );
}
