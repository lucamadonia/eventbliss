/**
 * EventTypesOrbit — 6 event-type icons arranged on an orbital path around a
 * central card that showcases the active type. Auto-rotates active index;
 * hover/click on any satellite focuses it and pauses rotation briefly.
 * Mobile (<md) falls back to the classic 2x3 grid for usability.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PartyPopper, Cake, Heart, Briefcase, Plane, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { GlassCard } from "@/components/ui/GlassCard";

interface OrbitType {
  icon: LucideIcon;
  labelKey: string;
  color: string;
  glow: string;
}

const TYPES: OrbitType[] = [
  { icon: PartyPopper, labelKey: "landing.eventTypes.bachelor", color: "text-primary", glow: "hsl(var(--primary))" },
  { icon: Heart, labelKey: "landing.eventTypes.bachelorette", color: "text-neon-pink", glow: "hsl(var(--neon-pink))" },
  { icon: Cake, labelKey: "landing.eventTypes.birthday", color: "text-warning", glow: "hsl(var(--warning))" },
  { icon: Briefcase, labelKey: "landing.eventTypes.team", color: "text-accent", glow: "hsl(var(--accent))" },
  { icon: Plane, labelKey: "landing.eventTypes.trip", color: "text-success", glow: "hsl(var(--success))" },
  { icon: Heart, labelKey: "landing.eventTypes.wedding", color: "text-destructive", glow: "hsl(var(--destructive))" },
];

const AUTO_ROTATE_MS = 3200;
const ORBIT_RADIUS = 180; // px on md+
const SATELLITE_SIZE = 72;

export function EventTypesOrbit() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % TYPES.length);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, prefersReducedMotion]);

  const ActiveIcon = TYPES[active].icon;

  return (
    <section id="solutions" className="relative py-24 px-4">
      <div className="container max-w-6xl mx-auto">
        <ScrollReveal variant="slide-up" className="text-center mb-14 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t("landing.eventTypes.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            {t("landing.eventTypes.subtitle")}
          </p>
        </ScrollReveal>

        {/* Mobile — 2x3 grid (same as before) */}
        <div className="grid grid-cols-2 md:hidden gap-4">
          {TYPES.map((type, i) => (
            <motion.button
              key={type.labelKey + i}
              type="button"
              onClick={() => navigate("/create")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="glass-card-hover rounded-2xl p-5 flex flex-col items-center gap-2 text-center"
            >
              <type.icon className={`w-10 h-10 ${type.color}`} />
              <span className="font-medium text-sm">{t(type.labelKey)}</span>
            </motion.button>
          ))}
        </div>

        {/* Desktop orbital */}
        <div
          className="hidden md:flex relative mx-auto items-center justify-center"
          style={{ width: ORBIT_RADIUS * 2 + SATELLITE_SIZE + 40, height: ORBIT_RADIUS * 2 + SATELLITE_SIZE + 40 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Orbital path */}
          <svg
            aria-hidden
            className="absolute inset-0"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#orbit-gradient)"
              strokeWidth="0.3"
              strokeDasharray="1 2"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="orbit-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="50%" stopColor="hsl(var(--neon-pink))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </svg>

          {/* Slowly rotating orbiter containing satellites */}
          <motion.div
            className="absolute inset-0"
            animate={prefersReducedMotion || paused ? undefined : { rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            {TYPES.map((type, i) => {
              const angle = (i / TYPES.length) * Math.PI * 2 - Math.PI / 2;
              const cx = 50 + 42 * Math.cos(angle);
              const cy = 50 + 42 * Math.sin(angle);
              const isActive = i === active;
              return (
                <motion.button
                  key={type.labelKey + i}
                  type="button"
                  className="absolute rounded-2xl glass-card flex flex-col items-center justify-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    width: SATELLITE_SIZE,
                    height: SATELLITE_SIZE,
                    transform: "translate(-50%, -50%)",
                    boxShadow: isActive ? `0 0 30px ${type.glow}, 0 0 60px ${type.glow}40` : undefined,
                    borderColor: isActive ? type.glow : undefined,
                  }}
                  animate={prefersReducedMotion || paused ? undefined : { rotate: -360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActive(i);
                    setPaused(true);
                  }}
                  aria-label={t(type.labelKey)}
                >
                  <type.icon className={`w-6 h-6 ${type.color}`} />
                  <span className="text-[10px] font-medium">{t(type.labelKey)}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Center card */}
          <div className="relative z-10" style={{ width: ORBIT_RADIUS * 1.1, height: ORBIT_RADIUS * 1.1 }}>
            <GlassCard className="w-full h-full flex flex-col items-center justify-center gap-4 text-center rounded-full border-2 border-primary/30 shadow-[0_0_80px_hsl(var(--primary)/0.3)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(6px)" }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center gap-3"
                >
                  <ActiveIcon className={`w-14 h-14 ${TYPES[active].color}`} />
                  <p className="font-display font-bold text-lg">{t(TYPES[active].labelKey)}</p>
                </motion.div>
              </AnimatePresence>
              <MagneticButton strength={0.3} sparkles={false}>
                <GradientButton size="sm" onClick={() => navigate("/create")}>
                  {t("landing.hero.createEvent")}
                </GradientButton>
              </MagneticButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
