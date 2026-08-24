/**
 * SceneEventPlan — Folie 1: eine echte Event-Karte setzt sich zusammen.
 * Datum, Gaeste und Ort erscheinen nacheinander (sceneStagger/sceneItem aus
 * lib/motion), damit sichtbar wird, wie wenig es braucht, um loszulegen.
 */
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, CalendarHeart, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sceneMotion } from "./onboarding-data";

export function SceneEventPlan() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { stagger, item } = sceneMotion(!!reduce);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="w-full rounded-3xl bg-card border border-border p-5 shadow-lg"
    >
      <motion.div variants={item} className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-[#df8eff]">
          {t("native.onboarding.scene.eventCard.statusBadge")}
        </span>
        <CalendarHeart className="w-5 h-5 text-violet-500 dark:text-[#df8eff]" aria-hidden />
      </motion.div>

      <motion.h3 variants={item} className="text-lg font-bold text-foreground mb-4 truncate">
        {t("native.onboarding.scene.eventCard.title")}
      </motion.h3>

      <div className="space-y-3">
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-violet-500 dark:text-[#df8eff]" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("native.create.stepReview.dateLabel")}
            </div>
            <div className="text-sm font-semibold text-foreground">
              {t("native.onboarding.scene.eventCard.dateValue")}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-fuchsia-500" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("native.create.stepReview.guestsLabel")}
            </div>
            <div className="text-sm font-semibold text-foreground">
              {t("native.create.stepGuests.guestCount", { count: 8 })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-pink-500" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("native.onboarding.scene.eventCard.locationLabel")}
            </div>
            <div className="text-sm font-semibold text-foreground">
              {t("native.onboarding.scene.eventCard.location")}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
