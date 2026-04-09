/**
 * ProfileScreen — native "Profile" tab.
 * User avatar, settings links, theme toggle, language, premium, logout.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Settings,
  Globe,
  Palette,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Check,
  Moon,
  Sun,
  Flower2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { supabase } from "@/integrations/supabase/client";
import { languages } from "@/i18n";
import { cn } from "@/lib/utils";

interface Item {
  icon: typeof Settings;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { user, isPremium } = useAuthContext();
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const displayName =
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Gast";
  const email = user?.email ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const currentLang = languages.find((l) => l.code === i18n.language);

  const go = (path: string) => {
    haptics.light();
    navigate(path);
  };

  const handleLogout = async () => {
    haptics.medium();
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const themes = [
    { id: "dark", label: "Dunkel", icon: Moon },
    { id: "light", label: "Hell", icon: Sun },
    { id: "rose", label: "Rosé", icon: Flower2 },
  ];

  const items: Item[] = [
    { icon: Settings, label: "Einstellungen", onClick: () => go("/settings") },
    {
      icon: Globe,
      label: "Sprache",
      sublabel: `${currentLang?.flag || "🌐"} ${currentLang?.name || "Deutsch"}`,
      onClick: () => { haptics.light(); setShowLangPicker((v) => !v); setShowThemePicker(false); },
    },
    {
      icon: Palette,
      label: "Darstellung",
      sublabel: themes.find((t) => t.id === theme)?.label || "Dunkel",
      onClick: () => { haptics.light(); setShowThemePicker((v) => !v); setShowLangPicker(false); },
    },
    { icon: Shield, label: "Datenschutz", onClick: () => go("/legal/privacy") },
    { icon: HelpCircle, label: "Hilfe & Support", onClick: () => go("/legal/imprint") },
    { icon: LogOut, label: "Abmelden", onClick: handleLogout, destructive: true },
  ];

  return (
    <div className="relative h-full flex flex-col bg-background safe-top">
      {/* Header with avatar */}
      <motion.div
        className="px-5 pt-6 pb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.soft}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-2xl font-display font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              {initials}
            </div>
            {isPremium && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-background shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-white truncate">
              {displayName}
            </h2>
            <p className="text-sm text-white/50 truncate">{email}</p>
            {isPremium && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30">
                <Crown className="w-3 h-3 text-amber-300" />
                <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide">
                  Premium
                </span>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Premium upsell */}
      {!isPremium && (
        <motion.button
          className="mx-5 mb-5 relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.soft, delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptics.medium();
            navigate("/premium");
          }}
        >
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-white/90 font-semibold">
                Premium freischalten
              </p>
              <p className="text-lg font-display font-bold text-white mt-0.5">
                Alle Spiele · Unlimited
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </motion.button>
      )}

      {/* Menu list */}
      <div className="flex-1 overflow-y-auto native-scroll pb-tabbar">
        <motion.div
          className="mx-5 rounded-3xl overflow-hidden bg-white/5 border border-white/10 divide-y divide-white/5"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                variants={staggerItem}
                onClick={item.onClick}
                whileTap={{ scale: 0.98, backgroundColor: "rgba(255,255,255,0.05)" }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                  item.destructive ? "text-red-400" : "text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    item.destructive ? "bg-red-500/15" : "bg-foreground/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      item.destructive ? "text-red-400" : "text-foreground/80"
                    )}
                  />
                </div>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.sublabel && (
                  <span className="text-xs text-muted-foreground mr-1">{item.sublabel}</span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Language picker — inline expand */}
        <AnimatePresence>
          {showLangPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-5 mt-3 overflow-hidden rounded-2xl bg-card border border-border"
            >
              <div className="p-2 max-h-64 overflow-y-auto">
                {languages.map((lang) => {
                  const active = i18n.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        haptics.select();
                        i18n.changeLanguage(lang.code);
                        setShowLangPicker(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors",
                        active ? "bg-primary/15 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="flex-1">{lang.name}</span>
                      {active && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme picker — inline expand */}
        <AnimatePresence>
          {showThemePicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-5 mt-3 overflow-hidden rounded-2xl bg-card border border-border"
            >
              <div className="p-2">
                {themes.map((t) => {
                  const active = theme === t.id;
                  const ThemeIcon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        haptics.select();
                        setTheme(t.id);
                        setShowThemePicker(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors",
                        active ? "bg-primary/15 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <ThemeIcon className="w-4 h-4" />
                      <span className="flex-1">{t.label}</span>
                      {active && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground mt-6 mb-4">
          EventBliss · Version 1.0.0
        </p>
      </div>
    </div>
  );
}
