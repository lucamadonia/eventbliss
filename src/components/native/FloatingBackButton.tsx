/**
 * FloatingBackButton — always-visible back button overlay for native pages.
 *
 * Used on fullscreen pages (games, TV, auth) where no sticky MobileHeader
 * is shown but we still need a reliable way out.
 *
 * Positioned top-left, respects safe-area-top, high z-index.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { runBackGuards } from "@/lib/back-guard";

interface Props {
  onClick?: () => void;
  label?: string;
}

/**
 * Wohin ein Zurück führt, für das sich sonst niemand zuständig fühlt.
 *
 * Hier stand `navigate(-1)` — der EINZIGE Weg in der nativen Hülle, der auf
 * dem Dashboard landen konnte. Tabwechsel sind in `TabsLayer` reine
 * Sichtbarkeitswechsel, der Verlauf lautet nach einem Start über den
 * Spiele-Tab deshalb `[/, /games/ohrwurm]`, und ein Schritt zurück warf den
 * Nutzer mitten aus dem Spiel auf die Startseite.
 *
 * Dieselbe Regel wie `GameBackTarget` in `NativeApp.tsx` — aber unabhängig
 * davon, ob dessen Handler greift. Warum er auf dem Gerät nicht griff, ist
 * ungeklärt; die `console.warn` unten liefert dafür die fehlende Spur.
 */
function resolveBackTarget(pathname: string, search: string): string {
  if (pathname === "/games" || pathname.startsWith("/games/")) {
    // Ausnahme Party-Abend: Dort ist das Spiel Teil eines laufenden Abends,
    // die Spieleübersicht wäre ein Bruch im Ablauf.
    return new URLSearchParams(search).get("party") === "true" ? "/party" : "/games";
  }
  // Der große Bildschirm: aus dem Raum zurück zur Code-Eingabe, von dort
  // dorthin, wo er angeboten wird (GamesHub).
  if (pathname.startsWith("/tv/")) return "/tv";
  if (pathname === "/tv") return "/games";
  return "/";
}

/** Nur einmal je Pfad melden — die Meldung ist Diagnose, kein Dauerlärm. */
const warnedPaths = new Set<string>();

export function FloatingBackButton({ onClick, label }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();

  const handleBack = () => {
    haptics.light();
    // Dieser Button liegt bei Fullscreen-Seiten optisch ÜBER dem Zurück-Pfeil
    // der Seite selbst (z-[60], top-left). Ohne diese Abfrage hat ein Tipp
    // darauf mitten im Spiel die Route gewechselt und die laufende Partie
    // gelöscht. Hat sich jemand registriert (z. B. „einen Schritt zurück" oder
    // „Spiel wirklich verlassen?"), gehört das Zurück ihm.
    if (runBackGuards()) return;
    if (onClick) {
      onClick();
      return;
    }
    const to = resolveBackTarget(location.pathname, location.search);
    if (!warnedPaths.has(location.pathname)) {
      warnedPaths.add(location.pathname);
      console.warn(
        `[back-guard] Kein Handler zuständig auf ${location.pathname} — Rückfall auf ${to}`,
      );
    }
    navigate(to);
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
