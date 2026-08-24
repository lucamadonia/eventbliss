/**
 * SceneSurvey — Folie 2: eine Umfrage fuellt sich, Antworten trudeln ein.
 * Die drei Gaeste-Chips erscheinen nacheinander per Timer (bei Bewegungsarmut
 * sofort alle drei), waehrend der Zaehler darunter mitzaehlt.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { spring } from "@/lib/motion";
import { sceneMotion } from "./onboarding-data";

const RESPONDERS = ["Mara", "Ben", "Nils"];
const OPTIONS = [
  { key: "optionYes", emoji: "🎉" },
  { key: "optionMaybe", emoji: "🤔" },
  { key: "optionNo", emoji: "😢" },
] as const;

export function SceneSurvey() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { stagger, item } = sceneMotion(!!reduce);
  const [visible, setVisible] = useState(reduce ? RESPONDERS.length : 0);

  useEffect(() => {
    if (reduce) return;
    const timers = RESPONDERS.map((_, i) =>
      window.setTimeout(() => setVisible((v) => Math.max(v, i + 1)), 600 + i * 550),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [reduce]);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="w-full rounded-3xl bg-card border border-border p-5 shadow-lg"
    >
      <motion.span
        variants={item}
        className="block text-[10px] font-bold uppercase tracking-wider text-fuchsia-500 mb-2"
      >
        {t("native.onboarding.scene.survey.heading")}
      </motion.span>

      <motion.p variants={item} className="text-sm font-semibold text-foreground mb-3">
        {t("native.onboarding.scene.survey.question")}
      </motion.p>

      <motion.div variants={item} className="grid grid-cols-3 gap-2 mb-4">
        {OPTIONS.map((o) => (
          <div key={o.key} className="rounded-xl border border-border bg-muted/30 py-2 text-center">
            <div className="text-base leading-none mb-1" aria-hidden>
              {o.emoji}
            </div>
            <div className="text-[9px] font-medium text-muted-foreground">
              {t(`native.onboarding.scene.survey.${o.key}`)}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex items-center min-h-[1.75rem] mb-2">
        <AnimatePresence>
          {RESPONDERS.slice(0, visible).map((name, i) => (
            <motion.div
              key={name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.bouncy}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-card first:ml-0"
              style={{ marginLeft: i === 0 ? 0 : "-0.5rem", zIndex: RESPONDERS.length - i }}
            >
              {name.charAt(0)}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.p variants={item} className="text-xs text-muted-foreground">
        {t("native.onboarding.scene.survey.respondedCount", { count: visible, total: RESPONDERS.length })}
      </motion.p>
    </motion.div>
  );
}
