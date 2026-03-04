import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Shield, BarChart3, Target, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/ui/GlassCard";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "eventbliss_cookie_consent";

export function CookieBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const acceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptSelected = () => {
    saveConsent(preferences);
  };

  const rejectAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    setPreferences(onlyNecessary);
    saveConsent(onlyNecessary);
  };

  if (!isVisible || Capacitor.isNativePlatform()) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-6 md:p-8 shadow-lg border border-border/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold mb-2">
                  {t("cookie.title")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("cookie.description")}
                </p>
              </div>
              <button
                onClick={rejectAll}
                className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                aria-label={t("common.close")}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 mb-6 pt-4 border-t border-border/50">
                    {/* Necessary Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-medium text-sm">{t("cookie.necessary.title")}</p>
                          <p className="text-xs text-muted-foreground">{t("cookie.necessary.description")}</p>
                        </div>
                      </div>
                      <Switch checked disabled className="data-[state=checked]:bg-success" />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{t("cookie.analytics.title")}</p>
                          <p className="text-xs text-muted-foreground">{t("cookie.analytics.description")}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.analytics}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, analytics: checked }))
                        }
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-medium text-sm">{t("cookie.marketing.title")}</p>
                          <p className="text-xs text-muted-foreground">{t("cookie.marketing.description")}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.marketing}
                        onCheckedChange={(checked) => 
                          setPreferences(prev => ({ ...prev, marketing: checked }))
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="sm:mr-auto"
              >
                {showDetails ? t("cookie.hideDetails") : t("cookie.showDetails")}
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={rejectAll}>
                  {t("cookie.rejectAll")}
                </Button>
                {showDetails && (
                  <Button variant="secondary" onClick={acceptSelected}>
                    <Check className="w-4 h-4 mr-2" />
                    {t("cookie.acceptSelected")}
                  </Button>
                )}
                <Button onClick={acceptAll} className="gradient-primary text-primary-foreground">
                  {t("cookie.acceptAll")}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}