import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "agency_welcome_dismissed";

export function AgencyWelcomeBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasWelcomeParam = new URLSearchParams(window.location.search).get("welcome") === "1";
    const alreadyDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (hasWelcomeParam && !alreadyDismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -16, height: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="relative mb-6 rounded-2xl bg-gradient-to-br from-violet-600/20 via-pink-600/20 to-amber-500/20 border border-violet-500/30 p-6 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-48 h-48 bg-gradient-to-br from-pink-500/20 to-transparent blur-3xl rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-36 h-36 bg-gradient-to-br from-violet-500/20 to-transparent blur-3xl rounded-full" />
            <button
              onClick={dismiss}
              aria-label={t("common.dismiss", "Schließen")}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative flex flex-col md:flex-row md:items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30 shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-black text-white mb-1.5 leading-tight">
                  {t("agency.welcome.title", "Herzlich willkommen!")}
                </h3>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  {t("agency.welcome.subtitle", "Dein Starter-Paket ist aktiv. Entdecke alle Module in der Sidebar — locked Module kannst du jederzeit per Upgrade freischalten.")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button
                  onClick={() => navigate("/agency/pricing")}
                  className="bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:shadow-[0_12px_32px_rgba(236,72,153,0.45)] text-white border-0 font-bold h-11 px-5 rounded-xl cursor-pointer transition-all"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {t("agency.welcome.ctaPricing", "Upgrade-Optionen ansehen")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={dismiss}
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/5 h-11 px-4 rounded-xl cursor-pointer"
                >
                  {t("agency.welcome.dismiss", "Später")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
