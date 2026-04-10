/**
 * ProfileScreen — native "Profile" tab.
 * User avatar, settings links, theme toggle, language, premium, logout.
 */
import { useState, useRef, useCallback } from "react";
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
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { useHaptics } from "@/hooks/useHaptics";
import { useDrinkingMode } from "@/hooks/useDrinkingMode";
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
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useAdmin();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const drinkingMode = useDrinkingMode();
  const [showBeerBurst, setShowBeerBurst] = useState(false);
  const [showAgeConfirm, setShowAgeConfirm] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);

  // Easter Egg: tap version text 5 times within 3 seconds
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVersionTap = useCallback(() => {
    if (drinkingMode.isActivated) return; // already discovered
    tapCountRef.current += 1;
    haptics.light();
    if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 3000);
    }
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      // Show age confirmation dialog FIRST — don't activate yet
      haptics.medium();
      setShowAgeConfirm(true);
      setAgeChecked(false);
    }
  }, [drinkingMode, haptics]);

  const confirmActivation = useCallback(() => {
    if (!ageChecked) return;
    setShowAgeConfirm(false);
    drinkingMode.activate();
    haptics.celebrate();
    setShowBeerBurst(true);
    setTimeout(() => setShowBeerBurst(false), 4000);
  }, [ageChecked, drinkingMode, haptics]);

  const displayName =
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    t('native.profile.guest');
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
    { id: "dark", label: t('native.profile.themeDark'), icon: Moon },
    { id: "light", label: t('native.profile.themeLight'), icon: Sun },
    { id: "rose", label: t('native.profile.themeRose'), icon: Flower2 },
  ];

  const items: Item[] = [
    // Admin — only visible for admin users
    ...(isAdmin ? [{
      icon: ShieldCheck,
      label: t('native.profile.adminPanel'),
      sublabel: t('native.profile.adminDashboard'),
      onClick: () => go("/admin"),
    } as Item] : []),
    { icon: Settings, label: t('native.profile.settings'), onClick: () => go("/settings") },
    {
      icon: Globe,
      label: t('native.profile.language'),
      sublabel: `${currentLang?.flag || "🌐"} ${currentLang?.name || "Deutsch"}`,
      onClick: () => { haptics.light(); setShowLangPicker((v) => !v); setShowThemePicker(false); },
    },
    {
      icon: Palette,
      label: t('native.profile.appearance'),
      sublabel: themes.find((th) => th.id === theme)?.label || t('native.profile.themeDark'),
      onClick: () => { haptics.light(); setShowThemePicker((v) => !v); setShowLangPicker(false); },
    },
    // Party-Modus (18+) — only visible after Easter Egg discovery
    ...(drinkingMode.isActivated ? [
      {
        icon: Sparkles,
        label: t('native.profile.partyMode'),
        sublabel: drinkingMode.isDrinkingMode ? t('native.profile.partyModeOn') : t('native.profile.partyModeOff'),
        onClick: () => { haptics.select(); drinkingMode.toggle(); },
      } as Item,
      // Party Stats — only visible when drinking mode is ON
      ...(drinkingMode.isDrinkingMode ? [{
        icon: Sparkles,
        label: t('native.profile.partyStats'),
        sublabel: t('native.profile.partyStatsRounds', { count: drinkingMode.drinkCount }),
        onClick: () => go("/party-stats"),
      } as Item] : []),
    ] : []),
    { icon: Shield, label: t('native.profile.privacy'), onClick: () => go("/legal/privacy") },
    { icon: HelpCircle, label: t('native.profile.helpSupport'), onClick: () => go("/legal/imprint") },
    { icon: LogOut, label: t('native.profile.logout'), onClick: handleLogout, destructive: true },
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
                {t('native.profile.unlockPremium')}
              </p>
              <p className="text-lg font-display font-bold text-white mt-0.5">
                {t('native.profile.unlockPremiumSub')}
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

        <p
          className="text-center text-xs text-muted-foreground mt-6 mb-4 select-none cursor-default"
          onClick={handleVersionTap}
        >
          {t('native.profile.version')}
          {drinkingMode.isDrinkingMode && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-400/30">
              18+
            </span>
          )}
        </p>
      </div>

      {/* Age confirmation dialog — before activation */}
      <AnimatePresence>
        {showAgeConfirm && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAgeConfirm(false)} />
            <motion.div
              className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl"
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              transition={spring.bouncy}
            >
              <div className="text-center mb-4">
                <span className="text-5xl">🍺</span>
                <h3 className="text-xl font-display font-bold text-foreground mt-3">
                  {t('native.profile.partyModeTitle')}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-5">
                {t('native.profile.partyModeWarning')}
              </p>

              {/* Age checkbox */}
              <button
                onClick={() => { haptics.select(); setAgeChecked(!ageChecked); }}
                className="w-full flex items-start gap-3 p-3 rounded-2xl bg-foreground/5 border border-border mb-5 text-left"
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  ageChecked ? "bg-primary border-primary" : "border-muted-foreground/40"
                )}>
                  {ageChecked && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-foreground leading-snug">
                  {t('native.profile.partyModeCheckbox')}
                </span>
              </button>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { haptics.light(); setShowAgeConfirm(false); }}
                  className="flex-1 h-12 rounded-2xl bg-foreground/5 border border-border text-foreground text-sm font-semibold"
                >
                  {t('native.profile.partyModeCancel')}
                </button>
                <motion.button
                  onClick={confirmActivation}
                  disabled={!ageChecked}
                  whileTap={ageChecked ? { scale: 0.96 } : {}}
                  className={cn(
                    "flex-1 h-12 rounded-2xl font-semibold text-sm transition-all",
                    ageChecked
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_4px_20px_-4px_rgba(245,158,11,0.5)]"
                      : "bg-foreground/10 text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  {t('native.profile.partyModeActivate')}
                </motion.button>
              </div>

              <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
                {t('native.profile.partyModeDisclaimer')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Epic Party-Modus activation — full-screen celebration */}
      <AnimatePresence>
        {showBeerBurst && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Dark overlay + amber glow pulse */}
            <motion.div
              className="absolute inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.35), transparent 70%)" }}
              animate={{ scale: [0.8, 1.3, 1], opacity: [0, 1, 0.6] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Wave 1 — 20 emojis burst outward */}
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * 360 + Math.random() * 18;
              const rad = (angle * Math.PI) / 180;
              const dist = 150 + Math.random() * 100;
              const emojis = ["🍻", "🍺", "🎉", "🥂", "🍾", "🎊", "🥳", "🔥"];
              return (
                <motion.span
                  key={`w1-${i}`}
                  className="absolute text-4xl"
                  style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.6))" }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.4, 1.2, 0.6],
                    rotate: (Math.random() - 0.5) * 540,
                  }}
                  transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], times: [0, 0.2, 0.7, 1], delay: i * 0.03 }}
                >
                  {emojis[i % emojis.length]}
                </motion.span>
              );
            })}

            {/* Wave 2 — delayed second burst with different emojis */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * 360 + 11;
              const rad = (angle * Math.PI) / 180;
              const dist = 100 + Math.random() * 120;
              const emojis = ["🍹", "🍸", "🎵", "💃", "🕺", "✨", "🌟", "🎶"];
              return (
                <motion.span
                  key={`w2-${i}`}
                  className="absolute text-3xl"
                  style={{ filter: "drop-shadow(0 0 6px rgba(236,72,153,0.5))" }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.2, 1, 0.4],
                    rotate: (Math.random() - 0.5) * 360,
                  }}
                  transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 + i * 0.04 }}
                >
                  {emojis[i % emojis.length]}
                </motion.span>
              );
            })}

            {/* Pulsing rings */}
            {[0, 0.3, 0.6].map((delay, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute w-40 h-40 rounded-full border-2 border-amber-400/60"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 3.5], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, delay, ease: "easeOut" }}
              />
            ))}

            {/* Central hero — big emoji + text with bounce */}
            <motion.div
              className="relative text-center z-10"
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: [0, 1.5, 1], opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            >
              {/* Glowing emoji */}
              <motion.div
                className="text-8xl mb-4"
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 30px rgba(245,158,11,0.8))" }}
              >
                🍻
              </motion.div>

              {/* Title with gradient */}
              <motion.h2
                className="text-3xl font-display font-black tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, ...spring.soft }}
              >
                <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                  {t('native.profile.partyModeActivated')}
                </span>
              </motion.h2>

              <motion.p
                className="text-lg text-amber-200/80 font-semibold mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {t('native.profile.partyModeActivatedSub')}
              </motion.p>

              <motion.p
                className="text-sm text-amber-300/50 mt-3 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {t('native.profile.partyModeActivatedDesc')}
              </motion.p>
            </motion.div>

            {/* Confetti rain — falling from top */}
            {Array.from({ length: 30 }).map((_, i) => {
              const colors = ["#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#10B981", "#F43F5E", "#FBBF24", "#A78BFA"];
              const left = Math.random() * 100;
              const delay = Math.random() * 1.5;
              const size = 4 + Math.random() * 6;
              const isRect = Math.random() > 0.5;
              return (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute top-0"
                  style={{
                    left: `${left}%`,
                    width: isRect ? size : size * 0.7,
                    height: isRect ? size * 0.4 : size * 0.7,
                    backgroundColor: colors[i % colors.length],
                    borderRadius: isRect ? "1px" : "50%",
                  }}
                  initial={{ y: -20, opacity: 0, rotate: 0 }}
                  animate={{
                    y: typeof window !== "undefined" ? window.innerHeight + 20 : 900,
                    opacity: [0, 1, 1, 0.8, 0],
                    rotate: (Math.random() - 0.5) * 720,
                    x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
                  }}
                  transition={{
                    duration: 2.5 + Math.random() * 1.5,
                    delay: delay + 0.3,
                    ease: "easeIn",
                  }}
                />
              );
            })}

            {/* Floating party text badges */}
            {["PROST! 🍻", "CHEERS! 🥂", "PARTY! 🎉", "SKOL! 🍺"].map((text, i) => (
              <motion.div
                key={`badge-${i}`}
                className="absolute px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white text-xs font-bold shadow-lg backdrop-blur"
                style={{ filter: "drop-shadow(0 0 10px rgba(245,158,11,0.5))" }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.1, 1, 0.8],
                  x: (i % 2 === 0 ? -1 : 1) * (80 + Math.random() * 60),
                  y: -100 - i * 40 + Math.random() * 30,
                  rotate: (i % 2 === 0 ? -1 : 1) * (5 + Math.random() * 10),
                }}
                transition={{ duration: 2, delay: 0.8 + i * 0.25, ease: "easeOut" }}
              >
                {text}
              </motion.div>
            ))}

            {/* Dismiss tap area */}
            <button
              className="absolute inset-0 z-20"
              onClick={() => setShowBeerBurst(false)}
              aria-label={t('native.profile.close')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
