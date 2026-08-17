/**
 * FloatingBackButton — always-visible back button overlay for native pages.
 *
 * Used on fullscreen pages (games, TV, auth) where no sticky MobileHeader
 * is shown but we still need a reliable way out.
 *
 * Positioned top-left, respects safe-area-top, high z-index.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { runBackGuards } from "@/lib/back-guard";

interface Props {
  onClick?: () => void;
  label?: string;
}

export function FloatingBackButton({ onClick, label }: Props) {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const handleBack = () => {
    haptics.light();
    // Dieser Button liegt bei Fullscreen-Seiten optisch ÜBER dem Zurück-Pfeil
    // der Seite selbst (z-[60], top-left). Ohne diese Abfrage hat ein Tipp
    // darauf mitten im Spiel die Route gewechselt und die laufende Partie
    // gelöscht. Hat sich jemand registriert (z. B. „einen Schritt zurück" oder
    // „Spiel wirklich verlassen?"), gehört das Zurück ihm.
    if (runBackGuards()) return;
    if (onClick) onClick();
    else navigate(-1);
  };

  return (
    <motion.button
      onClick={handleBack}
      className="fixed top-0 left-0 z-[60] safe-top m-3 flex items-center gap-1 pr-3 pl-2 h-10 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Zurück"
    >
      <ChevronLeft className="w-5 h-5" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </motion.button>
  );
}
