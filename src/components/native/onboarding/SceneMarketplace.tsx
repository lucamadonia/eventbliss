/**
 * SceneMarketplace — Folie 3: Dienstleister nach Stadt buchen.
 * Staedtechips oben (Eigennamen, keine Uebersetzung noetig), darunter drei
 * Marktplatz-Kategorien mit dem echten "Buchbar"-Badge aus dem Marketplace.
 */
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sceneMotion } from "./onboarding-data";

const CITIES = ["Berlin", "Wien", "Zürich"];

const CATEGORIES = [
  { key: "catPhoto", accent: "#df8eff" },
  { key: "catVenue", accent: "#5ad1e6" },
  { key: "catCatering", accent: "#f9ca24" },
] as const;

export function SceneMarketplace() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { stagger, item } = sceneMotion(!!reduce);

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="w-full rounded-3xl bg-card border border-border p-4 shadow-lg space-y-2.5"
    >
      <motion.div variants={item} className="flex items-center gap-1.5">
        {CITIES.map((city) => (
          <span
            key={city}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20"
          >
            {city}
          </span>
        ))}
      </motion.div>

      {CATEGORIES.map((cat) => (
        <motion.div
          key={cat.key}
          variants={item}
          className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-2.5"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${cat.accent}22` }}
          >
            <Star className="w-4 h-4" style={{ color: cat.accent }} aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {t(`native.onboarding.scene.marketplace.${cat.key}`)}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" aria-hidden />
              {CITIES[0]}
            </div>
          </div>
          <span className="shrink-0 px-2 py-1 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500">
            {t("marketplace.partnerAgencies.bookable")}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
