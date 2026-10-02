/**
 * Daumenzone: Hinweis + Ziehen/Eingiessen (aus BrewGame ausgelagert).
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { BrewPalette } from "./brew-palette";

export interface BrewActionBarProps {
  hint: string;
  theme: BrewPalette;
  accent: string;
  drawLeads: boolean;
  cardsRemaining: number;
  isMyTurn: boolean;
  hasPenalty: boolean;
  /** Aufdeckmoment oder Guss laeuft. */
  blocked: boolean;
  trayCount: number;
  trayHits: number;
  reduceMotion: boolean;
  onDraw: () => void;
  onPour: () => void;
}

export function BrewActionBar({ hint, theme, accent, drawLeads, cardsRemaining, isMyTurn, hasPenalty, blocked, trayCount, trayHits, reduceMotion, onDraw, onPour }: BrewActionBarProps) {
  const { t } = useTranslation();
  return (
    <div className="sticky bottom-2 z-30 mx-3 mt-5 rounded-3xl border border-white/10 bg-black/55 px-3 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl">
      {/* Sagt, was jetzt dran ist — und warum ein Knopf gesperrt ist. */}
      <p className="text-[12px] mb-2 text-center min-h-[1.2em]" style={{ color: theme.dim }}>{hint}</p>
      <div className="flex gap-2">
        {/*
          Die Rangfolge folgt dem Zustand, nicht der Reihenfolge im Code.
          Vorher war "Eingiessen" als einziger Knopf farbig gefuellt — und zu
          Zugbeginn gesperrt, waehrend "Ziehen", der einzige erlaubte Zug, wie
          ein Nebenknopf aussah. Die Oberflaeche zeigte also am staerksten auf
          das, was man gerade nicht tun kann.
        */}
        <motion.button
          onClick={onDraw}
          disabled={cardsRemaining === 0 || !isMyTurn || hasPenalty || blocked}
          className="relative flex-1 h-14 rounded-2xl font-black disabled:opacity-40"
          style={
            drawLeads
              ? { background: accent, color: theme.bg }
              : { background: theme.surface, color: theme.text, border: `1px solid ${accent}55` }
          }
          // Der Einsatz wird spuerbar, nicht berechenbar: je voller das
          // Tablett, desto unruhiger der Knopf. Die Kartenzahl steht daneben,
          // die Bewegung traegt also keine Information allein.
          // NUR `scale`. Frueher pulsierte hier zusaetzlich `boxShadow` — eine
          // Farb-Eigenschaft, die der Browser JEDES BILD neu zeichnet, und das
          // in einer Endlosschleife ueber die ganze Partie. Der Hauptthread
          // haengt dadurch sekundenlang: gemessen feuerte ein 60-ms-Zeitgeber
          // nur noch einmal pro Sekunde, und die Eingiess-Choreografie lief
          // gar nicht erst an (die Flugkarte trug bei 520 ms noch
          // `transform: none`). Der Schein liegt jetzt auf einer eigenen
          // Ebene und wird ueber `opacity` geblendet — beides im Compositor.
          animate={
            reduceMotion || trayCount === 0 || !isMyTurn
              ? { scale: 1 }
              : { scale: [1, 1 + Math.min(trayCount, 6) * 0.004, 1] }
          }
          transition={{ duration: Math.max(0.7, 1.8 - trayCount * 0.16), repeat: Infinity, ease: "easeInOut" }}
        >
          {!reduceMotion && trayCount > 0 && isMyTurn && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ boxShadow: `0 0 ${8 + Math.min(trayCount, 6) * 4}px 0 ${accent}` }}
              animate={{ opacity: [0, trayCount > 3 ? 0.4 : 0.2, 0] }}
              transition={{ duration: Math.max(0.7, 1.8 - trayCount * 0.16), repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span className="relative">
            {cardsRemaining === 0 ? t("games.brew.deckEmpty") : t("games.brew.drawFromDeck")}
          </span>
        </motion.button>
        <button
          onClick={onPour}
          disabled={trayCount === 0 || !isMyTurn || blocked}
          className="relative flex-1 h-14 rounded-2xl font-black disabled:opacity-40"
          style={
            drawLeads
              ? { background: theme.surface, color: theme.text, border: `1px solid ${accent}55` }
              : { background: accent, color: theme.bg }
          }
        >
          {trayHits > 0
            ? t("games.brew.pourInCount", { count: trayHits })
            : t("games.brew.pourIn")}
        </button>
      </div>
    </div>

  );
}
