import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Sparkles, Check, Crown, X, Contact, CalendarDays, CalendarCheck, FileText,
  Wallet, Radio, Users, FolderOpen, BarChart3, CalendarSync, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tier = "starter" | "professional" | "enterprise";

const UNLOCKED_MODULES: Record<Tier, Array<{ key: string; icon: typeof Sparkles }>> = {
  starter: [],
  professional: [
    { key: "contacts", icon: Contact },
    { key: "calendar", icon: CalendarDays },
    { key: "bookingCalendar", icon: CalendarCheck },
    { key: "templates", icon: FileText },
    { key: "budgetengine", icon: Wallet },
    { key: "runofshow", icon: Radio },
  ],
  enterprise: [
    { key: "team", icon: Users },
    { key: "files", icon: FolderOpen },
    { key: "reports", icon: BarChart3 },
    { key: "guides", icon: Users },
    { key: "calendarSync", icon: CalendarSync },
  ],
};

export function TierUpgradeCelebration() {
  const { t } = useTranslation();
  const [upgradedTier, setUpgradedTier] = useState<Tier | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgraded = params.get("tier_upgraded");
    if (upgraded === "professional" || upgraded === "enterprise") {
      setUpgradedTier(upgraded);
    }
  }, []);

  const close = () => {
    setUpgradedTier(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("tier_upgraded");
    window.history.replaceState({}, "", url.toString());
  };

  if (!upgradedTier) return null;

  const isEnterprise = upgradedTier === "enterprise";
  const tierName = isEnterprise ? "Enterprise" : "Professional";
  const modules = UNLOCKED_MODULES[upgradedTier];
  const gradient = isEnterprise
    ? "from-amber-500 via-orange-600 to-red-600"
    : "from-violet-600 via-pink-600 to-amber-500";
  const TierIcon = isEnterprise ? Crown : Rocket;

  return (
    <AnimatePresence>
      {upgradedTier && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#1a0a2e] to-[#0a0118] border border-white/15 shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className={`absolute -inset-12 bg-gradient-to-br ${gradient} opacity-20 blur-3xl pointer-events-none`} />

            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative p-8 md:p-10 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
                className={`mx-auto mb-5 w-20 h-20 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
                style={{ boxShadow: "0 20px 48px rgba(236,72,153,0.5)" }}
              >
                <TierIcon className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight"
              >
                {t("agency.celebration.title", "Willkommen in {{tier}}!", { tier: tierName })}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/75 text-base md:text-lg mb-8"
              >
                {t("agency.celebration.subtitle", "{{count}} neue Module sind jetzt freigeschaltet.", { count: modules.length })}
              </motion.p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {modules.map((mod, i) => {
                  const Icon = mod.icon;
                  return (
                    <motion.div
                      key={mod.key}
                      initial={{ opacity: 0, y: 12, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
                      className="relative bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 overflow-hidden group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className={`relative w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="relative text-center">
                        <div className="text-[11px] text-white/80 font-semibold leading-tight line-clamp-2">
                          {t(`agency.locked.${mod.key}.title`, mod.key)}
                        </div>
                        <Check className="w-3 h-3 mx-auto mt-1 text-emerald-400" strokeWidth={3} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + modules.length * 0.08 + 0.2 }}
              >
                <Button
                  onClick={close}
                  size="lg"
                  className={`w-full bg-gradient-to-r ${gradient} hover:shadow-[0_16px_48px_rgba(236,72,153,0.5)] text-white border-0 font-bold h-12 rounded-xl cursor-pointer transition-all`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t("agency.celebration.cta", "Los geht's")}
                </Button>
                <p className="text-white/50 text-xs mt-4">
                  {t("agency.celebration.invoice", "Deine nächste Rechnung findest du im Stripe Customer Portal.")}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
