/**
 * Vollbild-Dialoge von GEBRÄU: Bust/Strafe und „Verlassen?“ (aus BrewGame
 * ausgelagert). Das Portal ist funktional: PageTransition setzt `transform`
 * und wuerde ein normales fixed-Overlay unter der nativen Navigation festhalten.
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import type { BrewPalette } from "./brew-palette";
import type { Skin } from "./brew-content";

/**
 * Der Trink-Disclaimer steckt BEWUSST NICHT hier drin: `recordDrink()` zaehlt im
 * localStorage des jeweiligen Geraets. Waere er Teil der Strafe, wuerde der
 * Gastgeber online die Schlucke aller anderen sammeln und "50 Runden!" erschiene
 * auf dem falschen Bildschirm. Die Strafe reist, der Zaehler bleibt zu Hause.
 */
export type Penalty =
  | { kind: "task"; taskIndex: number }
  | { kind: "sip" };

export function BrewPenaltyOverlay({ penalty, visible, skin, theme, accent, reduceMotion, penaltyTasks, sipDisclaimer, onContinue, onLeave }: {
  penalty: Penalty | null;
  /** Nur wer die Strafe hat (und der Gastgeber) sieht sie. */
  visible: boolean;
  skin: Skin;
  theme: BrewPalette;
  accent: string;
  reduceMotion: boolean;
  penaltyTasks: string[];
  sipDisclaimer: { message: string; emoji: string } | null;
  onContinue: () => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <NativeOverlayPortal>
      {penalty && visible && (
        <motion.div
          data-testid="brew-penalty-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-none px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-[max(.75rem,env(safe-area-inset-top))]"
          style={{ background: "rgba(11,15,26,0.88)" }}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="brew-penalty-title"
        >
          <motion.div
            className="relative flex w-full max-w-xs flex-col overflow-hidden rounded-3xl text-center"
            style={{
              background: theme.surface,
              color: theme.text,
              maxHeight: "calc(100dvh - max(1.5rem, env(safe-area-inset-top)) - max(1.5rem, env(safe-area-inset-bottom)))",
            }}
            initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <button
              type="button"
              onClick={onLeave}
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border"
              style={{ borderColor: `${theme.dim}66`, color: theme.text, background: `${theme.bg}cc` }}
              aria-label={t("games.brew.leave")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-2 pt-5">
            <p id="brew-penalty-title" className="px-9 text-2xl font-black">
              {skin === "brew" ? t("games.brew.bustTitleBrew") : t("games.brew.bustTitleBar")}
            </p>
            <p className="text-sm mt-1" style={{ color: theme.dim }}>
              {skin === "brew" ? t("games.brew.bustBodyBrew") : t("games.brew.bustBodyBar")}
            </p>

            {penalty.kind === "task" ? (
              <>
                <p className="text-[13px] font-bold mt-4" style={{ color: theme.dim }}>
                  {t("games.brew.penaltyIntro")}
                </p>
                <p className="font-bold mt-1">{penaltyTasks[penalty.taskIndex] ?? ""}</p>
              </>
            ) : (
              <>
                <p className="font-bold mt-4">{t("games.brew.sipPenalty")}</p>
                {sipDisclaimer && (
                  <p className="text-xs mt-2" style={{ color: theme.dim }}>
                    {sipDisclaimer.emoji} {sipDisclaimer.message}
                  </p>
                )}
              </>
            )}

            {/* Weiter darf nur, wer die Strafe hat — sonst klickt ein Zuschauer
                den Zug der anderen weg. */}
            </div>
            <div className="shrink-0 border-t border-white/10 bg-black/10 px-5 pb-5 pt-3">
              <button
                type="button"
                data-testid="brew-penalty-continue"
                onClick={onContinue}
                className="h-12 w-full rounded-2xl font-black"
                style={{ background: accent, color: theme.bg }}
              >
                {t("games.brew.bustContinue")}
              </button>

            <button
              type="button"
              onClick={onLeave}
              className="mt-2 h-11 w-full rounded-2xl border font-bold"
              style={{ borderColor: `${theme.dim}80`, color: theme.text }}
            >
              {t("games.brew.leave")}
            </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </NativeOverlayPortal>
  );
}

export function BrewLeaveDialog({ open, theme, accent, onStay, onLeave }: {
  open: boolean; theme: BrewPalette; accent: string; onStay: () => void; onLeave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <NativeOverlayPortal>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto px-6 py-4" style={{ background: "rgba(11,15,26,0.85)" }}>
          <div className="w-full max-w-xs rounded-3xl p-5 text-center" style={{ background: theme.surface }}>
            <p className="font-black">{t("games.brew.leaveTitle")}</p>
            <p className="text-xs mt-1" style={{ color: theme.dim }}>{t("games.brew.leaveBody")}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={onStay} className="flex-1 h-11 rounded-2xl font-bold" style={{ background: accent, color: theme.bg }}>
                {t("games.brew.leaveStay")}
              </button>
              <button onClick={onLeave} className="flex-1 h-11 rounded-2xl font-bold" style={{ border: `1px solid ${theme.dim}`, color: theme.dim }}>
                {t("games.brew.leaveGo")}
              </button>
            </div>
          </div>
        </div>
      )}
    </NativeOverlayPortal>
  );
}
