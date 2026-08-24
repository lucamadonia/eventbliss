/**
 * GuestHomeView — Startseite fuer nicht angemeldete Gaeste.
 *
 * WARUM EIGENE ANSICHT: HomeScreen nutzte `user` bisher nur fuer die
 * Begruessung — ein Gast sah dieselbe leere Startseite wie ein Angemeldeter
 * ohne Events, ohne dass irgendwo stand, was er JETZT tun kann. Dabei geht
 * heute schon sehr viel ohne Konto:
 *   - Ein ECHTES Event anlegen: CreateEventFlow kennt `isGuest` und legt per
 *     savePendingClaim() einen Anspruchs-Token an — der Event entsteht
 *     wirklich und gehoert dem Gast nach der spaeteren Anmeldung.
 *   - Alle 21 Spiele spielen (Party-Modus, Fernseher inklusive).
 *   - Den Marktplatz durchsuchen (Route /marketplace, ungeschuetzt).
 * Diese Ansicht bietet genau diese drei echten Wege an, statt eine
 * Anmelde-Huerde vorzuschalten — der Hinweis am Ende ist bewusst leise.
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Store, LogIn } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { spring, sceneStagger, sceneItem } from "@/lib/motion";
import { FloatingOrbs } from "@/components/vfx/FloatingOrbs";
import { GuestOfferCard } from "@/components/native/guest/GuestOfferCard";
import { GuestGameFan } from "@/components/native/guest/GuestGameFan";

// Bei Bewegungsarmut zeigt jede Karte sofort ihren Endzustand statt zu
// wandern — `useAmbientMotion` waere hier falsch (siehe Kopfkommentar in
// lib/motion.ts), der richtige Riegel ist `useReducedMotion()`.
const staggerStill: Variants = { initial: {}, animate: {} };
const itemStill: Variants = { initial: { opacity: 1 }, animate: { opacity: 1 } };

export function GuestHomeView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const reduce = useReducedMotion();

  const go = (path: string) => {
    haptics.light();
    navigate(path);
  };

  return (
    <div className="relative h-full overflow-y-auto native-scroll safe-top pb-tabbar">
      {/* Ambient background — dieselbe Bildwelt wie beim angemeldeten Nutzer */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <FloatingOrbs />
      </div>

      {/* Hero */}
      <motion.div
        className="px-5 pt-6 pb-5"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay: 0.1 }}
      >
        <p className="text-sm font-semibold text-primary/90">
          {t('native.home.guest.eyebrow')}
        </p>
        <h1 className="mt-1.5 text-3xl font-display font-bold leading-tight tracking-tight text-foreground">
          {t('native.home.guest.heroTitle')} <br />
          <span className="bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#f9ca24] bg-clip-text text-transparent">
            {t('native.home.guest.heroHighlight')}
          </span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t('native.home.guest.heroSubtitle')}
        </p>
      </motion.div>

      {/* Drei echte Angebote */}
      <motion.div
        className="mb-6 flex flex-col gap-3 px-5"
        variants={reduce ? staggerStill : sceneStagger}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={reduce ? itemStill : sceneItem}>
          <GuestOfferCard
            onClick={() => go("/create")}
            eyebrow={t('native.home.guest.createEyebrow')}
            title={t('native.home.guest.createTitle')}
            subtitle={t('native.home.guest.createSub')}
            gradient="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600"
            icon={Calendar}
            iconGradient="bg-white/20 backdrop-blur"
            sheen
          />
        </motion.div>

        <motion.div variants={reduce ? itemStill : sceneItem}>
          <GuestOfferCard
            onClick={() => go("/games")}
            eyebrow={t('native.home.guest.playEyebrow')}
            title={t('native.home.guest.playTitle')}
            subtitle={t('native.home.guest.playSub')}
            gradient="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600"
            visual={<GuestGameFan />}
          />
        </motion.div>

        <motion.div variants={reduce ? itemStill : sceneItem}>
          <GuestOfferCard
            onClick={() => go("/marketplace")}
            eyebrow={t('native.home.guest.marketplaceEyebrow')}
            title={t('native.home.guest.marketplaceTitle')}
            subtitle={t('native.home.guest.marketplaceSub')}
            gradient="bg-gradient-to-br from-[#df8eff] via-[#ff6b98] to-[#f9ca24]"
            icon={Store}
            iconGradient="bg-white/20 backdrop-blur"
          />
        </motion.div>
      </motion.div>

      {/* Ruhiger Hinweis statt Anmelde-Huerde */}
      <motion.button
        onClick={() => go("/auth")}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mx-5 mb-8 flex items-start gap-2.5 rounded-2xl border border-dashed border-border bg-foreground/[0.03] px-4 py-3.5 text-left"
      >
        <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-snug text-muted-foreground">
          {t('native.home.guest.noAccountNote')}{" "}
          <span className="font-semibold text-primary">
            {t('native.home.guest.signInLink')}
          </span>
        </p>
      </motion.button>
    </div>
  );
}
