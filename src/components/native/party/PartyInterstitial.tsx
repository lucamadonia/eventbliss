/**
 * PartyInterstitial — der Moment zwischen zwei Spielen.
 *
 * Das ist der emotionale Kern des Formats: Wer ist aufgestiegen, wer ist
 * abgerutscht, und was kommt jetzt. Die Tabelle bewegt sich sichtbar, der
 * naechste Programmpunkt steht gross darunter.
 *
 * WICHTIGER VERTRAG: Die Komponente wird eingehaengt, SOLANGE
 * `session.playlistIndex` noch auf das gerade beendete Spiel zeigt. Erst
 * `onContinue` darf `advancePlaylist()` aufrufen. Wer bereits weitergerueckt
 * hat, gibt `finishedIndex` ausdruecklich mit.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Crown, Lock, Pause, PartyPopper, SkipForward, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ConfettiBurst } from "@/components/vfx/ConfettiBurst";
import { isSetlistEntryLocked } from "@/components/native/party/setlist";
import { derivePartyStandings } from "@/games/party/standings";
import type { PartySession } from "@/games/party/session-schema";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { playableGames } from "@/lib/playable-games";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { PartyStandingsList } from "./PartyStandingsList";

export interface PartyInterstitialProps {
  open: boolean;
  /** Die laufende Sitzung — Tabelle, Playlist und Historie werden daraus abgeleitet. */
  session: PartySession;
  /**
   * Position des GERADE BEENDETEN Spiels in der Playlist (0-basiert).
   * Standard: `session.playlistIndex` — siehe Vertrag im Dateikopf.
   */
  finishedIndex?: number;
  /** Weiter zum naechsten Spiel. Hier gehoert `advancePlaylist()` hin. */
  onContinue: (nextGameId: string) => void;
  /** Zurueck in die Lobby, Set-Liste bleibt erhalten. */
  onPause: () => void;
  /** Set-Liste ist durch — Abschluss zeigen. Fehlt sie, faellt es auf `onPause` zurueck. */
  onFinish?: () => void;
  /**
   * Das naechste Spiel ueberspringen — noetig, wenn es inzwischen gesperrt ist
   * (Gratis-Runden aufgebraucht, Tageswechsel). Umsetzung beim Einhaengeort:
   * zweimal `advancePlaylist()`. Fehlt sie, bleibt nur "Premium" oder "Pause".
   */
  onSkipNext?: () => void;
}

function gameNameOf(gameId: string, t: (key: string) => string): string {
  const game = playableGames.find((g) => g.id === gameId);
  return game ? t(game.nameKey) : gameId;
}

function gameImageOf(gameId: string): string | null {
  return playableGames.find((g) => g.id === gameId)?.image ?? null;
}

export function PartyInterstitial({
  open,
  session,
  finishedIndex,
  onContinue,
  onPause,
  onFinish,
  onSkipNext,
}: PartyInterstitialProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [celebrate, setCelebrate] = useState(false);

  const index = finishedIndex ?? session.playlistIndex;
  const total = session.playlist.length;
  const nextGameId = session.playlist[index + 1] ?? null;

  /**
   * Letzte Verteidigungslinie vor der Bezahlschranke.
   *
   * Beim Planen war das Spiel frei — bis hierher koennen Stunden vergangen
   * sein, der Tag gewechselt oder eine zweite Party dieselben Gratis-Runden
   * verbraucht haben. Statt in ein gesperrtes Spiel zu navigieren, bietet der
   * Uebergang hier Premium oder Ueberspringen an.
   */
  const nextLocked =
    nextGameId !== null &&
    isSetlistEntryLocked(nextGameId, { isPremium, premiumUnknown: premiumLoading });

  const standings = useMemo(
    () => derivePartyStandings(session.players, session.gameHistory),
    [session.players, session.gameHistory]
  );

  const lastEntry =
    session.gameHistory.length > 0
      ? session.gameHistory[session.gameHistory.length - 1]
      : null;

  /** Neuer Spitzenreiter = der Grund fuer Konfetti, nicht das blosse Oeffnen. */
  const leaderChanged = useMemo(() => {
    const leader = standings.find((s) => s.rank === 1);
    return !!leader && leader.prevRank !== null && leader.prevRank > 1;
  }, [standings]);

  useEffect(() => {
    if (!open) {
      setCelebrate(false);
      return;
    }
    if (leaderChanged) {
      haptics.celebrate();
      if (!reduce) setCelebrate(true);
    } else {
      haptics.medium();
    }
  }, [open, leaderChanged, haptics, reduce]);

  const handleContinue = () => {
    if (nextLocked) {
      haptics.warning();
      navigate("/premium");
      return;
    }
    haptics.success();
    if (nextGameId) onContinue(nextGameId);
    else if (onFinish) onFinish();
    else onPause();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/98 backdrop-blur-2xl flex flex-col safe-top"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.25 }}
          role="dialog"
          aria-modal="true"
        >
          {/* Ambiente */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute -top-32 -start-32 w-72 h-72 bg-[#df8eff]/12 rounded-full blur-[110px]" />
            <div className="absolute -bottom-32 -end-32 w-72 h-72 bg-[#ff6b98]/12 rounded-full blur-[110px]" />
          </div>

          <ConfettiBurst active={celebrate} count={36} onComplete={() => setCelebrate(false)} />

          <div className="relative z-10 flex-1 overflow-y-auto native-scroll px-5 pt-6 pb-40">
            {/* Fortschritt */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.soft}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500 dark:text-[#df8eff]">
                {t("nativeExtra.partyNight.gameXofY", { done: index + 1, total })}
              </p>
              <div className="mt-2 flex items-center gap-1" aria-hidden>
                {session.playlist.map((id, i) => (
                  <motion.span
                    key={`${id}-${i}`}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      i <= index ? "bg-gradient-to-r from-[#df8eff] to-[#ff6b98]" : "bg-foreground/10"
                    )}
                    initial={reduce ? false : { scaleX: i === index ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: "left" }}
                    transition={{ ...spring.soft, delay: i === index ? 0.2 : 0 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Was gerade zu Ende ging */}
            <motion.div
              className="mt-5"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.soft, delay: 0.08 }}
            >
              <h2 className="text-2xl font-display font-bold text-foreground leading-tight">
                {lastEntry
                  ? t("nativeExtra.partyNight.finishedHeadline", { game: lastEntry.gameName })
                  : t("nativeExtra.partyNight.standingsTitle")}
              </h2>
              {lastEntry && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {lastEntry.scored && lastEntry.winnerName ? (
                    <>
                      <Crown className="w-4 h-4 text-amber-500 dark:text-[#f9ca24]" aria-hidden />
                      {t("nativeExtra.partyNight.winnerLine", { name: lastEntry.winnerName })}
                    </>
                  ) : (
                    t("nativeExtra.partyNight.noWinnerLine")
                  )}
                </p>
              )}
            </motion.div>

            {/* Tabelle */}
            <div className="mt-5">
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Trophy className="w-4 h-4" aria-hidden />
                {t("nativeExtra.partyNight.standingsTitle")}
              </h3>
              <PartyStandingsList
                standings={standings}
                gained={lastEntry?.points}
                showDelta
              />
            </div>
          </div>

          {/* Fortsetzen / Pause */}
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-2xl px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.3 }}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              onClick={handleContinue}
              className="cursor-pointer w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#f9ca24] text-white font-bold shadow-[0_0_30px_rgba(223,142,255,0.32)] flex items-center gap-3 px-3 text-start"
            >
              {nextLocked ? (
                <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" aria-hidden />
                </span>
              ) : nextGameId && gameImageOf(nextGameId) ? (
                <img
                  src={gameImageOf(nextGameId) as string}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/25"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                />
              ) : (
                <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <PartyPopper className="w-5 h-5" aria-hidden />
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-[15px]">
                {nextLocked
                  ? t("nativeExtra.partyNight.unlockCta")
                  : nextGameId
                  ? t("nativeExtra.partyNight.continueTo", { game: gameNameOf(nextGameId, t) })
                  : t("nativeExtra.partyNight.showFinale")}
              </span>
              <ChevronRight className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden />
            </motion.button>

            {nextLocked && onSkipNext && (
              <button
                type="button"
                onClick={() => { haptics.light(); onSkipNext(); }}
                className="cursor-pointer w-full min-h-[44px] rounded-2xl border border-[#df8eff]/40 text-violet-500 dark:text-[#df8eff] font-semibold text-sm flex items-center justify-center gap-2 active:bg-[#df8eff]/10 transition-colors"
              >
                <SkipForward className="w-4 h-4 rtl:rotate-180" aria-hidden />
                {t("nativeExtra.partyNight.skipNext")}
              </button>
            )}

            <button
              type="button"
              onClick={() => { haptics.light(); onPause(); }}
              className="cursor-pointer w-full min-h-[44px] rounded-2xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 active:bg-foreground/5 transition-colors"
            >
              <Pause className="w-4 h-4" aria-hidden />
              {t("nativeExtra.partyNight.pause")}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              {nextLocked
                ? t("nativeExtra.partyNight.nextLockedHint")
                : nextGameId
                ? t("nativeExtra.partyNight.pauseHint")
                : t("nativeExtra.partyNight.setlistDone")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
