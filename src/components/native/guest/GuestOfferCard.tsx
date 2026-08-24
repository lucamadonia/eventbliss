/**
 * GuestOfferCard — ein Angebot der Gast-Startseite, das wirklich etwas tut.
 *
 * WARUM EIGENE KOMPONENTE: Drei fast identische Karten (Icon oder Artwork +
 * Text + Pfeil) wollten in GuestHomeView nicht dreifach kopiert werden — eine
 * Datenstruktur pro Angebot haelt die Datei lesbar und die Optik konsistent
 * mit den bestehenden CTA-Kacheln aus HomeScreen (gleicher Farbverlauf-Stil,
 * gleiche Sheen-Animation auf der Primaerkarte).
 */
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface GuestOfferCardProps {
  onClick: () => void;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Tailwind-Klassen fuer den Kartenhintergrund. */
  gradient: string;
  icon?: LucideIcon;
  /** Tailwind-Klassen fuer die Icon-Box (nur mit `icon` relevant). */
  iconGradient?: string;
  /** Eigenes Bildmaterial (z.B. GuestGameFan) statt eines Icons. */
  visual?: ReactNode;
  /** Laufende Lichtreflexion — nur fuer die hervorgehobene Primaerkarte. */
  sheen?: boolean;
}

export function GuestOfferCard({
  onClick,
  eyebrow,
  title,
  subtitle,
  gradient,
  icon: Icon,
  iconGradient,
  visual,
  sheen,
}: GuestOfferCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl p-5 text-left text-white shadow-[0_10px_40px_-8px_rgba(139,92,246,0.35)]",
        gradient
      )}
    >
      {/* Lauflicht — nur bei Bewegungswunsch und nur auf der Primaerkarte. */}
      {sheen && !reduce && (
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      )}
      <div className="relative flex items-center gap-4">
        {visual ? (
          visual
        ) : Icon ? (
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              iconGradient
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            {eyebrow}
          </p>
          <p className="mt-0.5 text-lg font-display font-bold leading-tight">
            {title}
          </p>
          <p className="mt-1 text-xs leading-snug text-white/70">
            {subtitle}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-white/70" />
      </div>
    </motion.button>
  );
}
