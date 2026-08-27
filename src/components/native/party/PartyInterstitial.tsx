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
import { ChevronRight, Crown, Lock, Pause, PartyPopper, SkipForward, Trophy, Tv } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { ConfettiBurst } from "@/components/vfx/ConfettiBurst";
import { isSetlistEntryLocked } from "@/components/native/party/setlist";
import { derivePartyStandings } from "@/games/party/standings";
import type { PartySession } from "@/games/party/session-schema";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { useTVContext } from "@/contexts/TVBroadcastContext";
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
  /** Optional: den Zwischenstand auf den Fernseher holen. Fehlt sie, bleibt der Knopf aus. */
  onShowOnTv?: () => void;
  /**
   * Gesetzt = die Anleitung dieses Spiels steht auf dem Fernseher und die
   * Runde soll sie lesen. Dann zeigt das Zwischenspiel statt "Weiter" den
   * Startknopf.
   */
  readyGameId?: string | null;
  onReadyStart?: () => void;
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
  onShowOnTv,
  readyGameId,
  onReadyStart,
}: PartyInterstitialProps) {
  const { t } = useTranslation();
  const tv = useTVContext();
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
  const leader = standings.find((standing) => standing.rank === 1) ?? null;

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
    // Im Bereit-Schritt startet derselbe Knopf das Spiel, statt ein zweites
    // Mal weiterzuschalten — sonst ruecke der Playlist-Zeiger doppelt.
    if (readyGameId && onReadyStart) onReadyStart();
    else if (nextGameId) onContinue(nextGameId);
    else if (onFinish) onFinish();
    else onPause();
  };

  return (
    <NativeOverlayPortal>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#060810] text-white safe-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Ambiente */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(223,142,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,245,255,.05) 1px,transparent 1px)", backgroundSize: "30px 30px", maskImage: "radial-gradient(circle at 50% 32%,black,transparent 76%)" }} />
              <div className="absolute -top-36 -start-28 h-80 w-80 rounded-full bg-[#df8eff]/16 blur-[110px]" />
              <div className="absolute -bottom-32 -end-32 h-80 w-80 rounded-full bg-[#8ff5ff]/10 blur-[110px]" />
            </div>

            <ConfettiBurst active={celebrate} count={36} onComplete={() => setCelebrate(false)} />

            <div className="relative z-10 flex-1 overflow-y-auto native-scroll px-5 pb-8 pt-6">
              {/* Fortschritt */}
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring.soft}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8ff5ff]">
                  {t("nativeExtra.partyNight.gameXofY", { done: index + 1, total })}
                </p>
                <div className="mt-2 flex items-center gap-1" aria-hidden>
                  {session.playlist.map((id, i) => (
                    <motion.span
                      key={`${id}-${i}`}
                      className={cn(
                        "h-1.5 flex-1 rounded-full",
                        i <= index ? "bg-gradient-to-r from-[#8ff5ff] via-[#df8eff] to-[#ff6b98]" : "bg-white/10"
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
                <h2 className="text-[clamp(1.8rem,8vw,2.4rem)] font-display font-black leading-[1.02] tracking-[-0.04em] text-white">
                  {lastEntry
                    ? t("nativeExtra.partyNight.finishedHeadline", { game: lastEntry.gameName })
                    : t("nativeExtra.partyNight.standingsTitle")}
                </h2>
                {lastEntry && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-white/58">
                    {lastEntry.scored && lastEntry.winnerName ? (
                      <>
                        <Crown className="h-4 w-4 text-[#FFD75E]" aria-hidden />
                        {t("nativeExtra.partyNight.winnerLine", { name: lastEntry.winnerName })}
                      </>
                    ) : (
                      t("nativeExtra.partyNight.noWinnerLine")
                    )}
                  </p>
                )}
                {leaderChanged && leader && (
                  <motion.div
                    className="mt-3 flex items-center gap-2 rounded-2xl border border-[#26E0C4]/22 bg-[#26E0C4]/9 px-3.5 py-3 text-sm font-black text-[#71f5df]"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ ...spring.bouncy, delay: 0.25 }}
                  >
                    <Trophy className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{t("tv.partyNight.leadChange", { name: leader.name })}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Tabelle */}
              <div className="mt-5">
                <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
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
              className="relative z-20 max-h-[48vh] shrink-0 space-y-2 overflow-y-auto border-t border-white/[0.08] bg-[#080a15]/94 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.soft, delay: 0.3 }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={spring.snappy}
                onClick={handleContinue}
                className="cursor-pointer flex min-h-[58px] w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#8ff5ff] via-[#df8eff] to-[#FFD75E] px-3 text-start font-black text-[#070812] shadow-[0_20px_48px_-26px_rgba(223,142,255,.95)]"
              >
                {nextLocked ? (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/15">
                    <Lock className="w-5 h-5" aria-hidden />
                  </span>
                ) : nextGameId && gameImageOf(nextGameId) ? (
                  <img
                    src={gameImageOf(nextGameId) as string}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-xl border border-black/15 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/15">
                    <PartyPopper className="w-5 h-5" aria-hidden />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-[15px]">
                  {readyGameId
                    ? t("nativeExtra.partyNight.startNow", { game: gameNameOf(readyGameId, t) })
                    : nextLocked
                    ? t("nativeExtra.partyNight.unlockCta")
                    : nextGameId
                    ? t("nativeExtra.partyNight.continueTo", { game: gameNameOf(nextGameId, t) })
                    : t("nativeExtra.partyNight.showFinale")}
                </span>
                <ChevronRight className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden />
              </motion.button>

              {/*
                Bereit-Schritt: Die Anleitung steht auf dem Fernseher, die
                Runde liest mit. Erst der Knopf oben startet — vorher sprang
                "Weiter" sofort ins Spiel, und wer die Regeln nicht kannte,
                hatte keine Gelegenheit sie zu lesen.
              */}
              {readyGameId && onReadyStart && (
                <div className="w-full rounded-2xl border border-[#df8eff]/25 bg-[#df8eff]/10 px-4 py-3 text-center text-xs font-semibold text-[#e6a5ff]">
                  {t("nativeExtra.partyNight.rulesOnTv")}
                </div>
              )}

              {nextLocked && onSkipNext && (
                <button
                  type="button"
                  onClick={() => { haptics.light(); onSkipNext(); }}
                  className="cursor-pointer flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#df8eff]/35 bg-[#df8eff]/8 text-sm font-bold text-[#e6a5ff] transition-colors active:bg-[#df8eff]/14"
                >
                  <SkipForward className="w-4 h-4 rtl:rotate-180" aria-hidden />
                  {t("nativeExtra.partyNight.skipNext")}
                </button>
              )}

              {/*
                Den Zwischenstand bewusst auf den Fernseher holen. Der Wert
                `showMap` reist im naechsten `tv-state` mit; der Fernseher
                zeigt daraufhin die Nacht-Route. Nur sichtbar, wenn ueberhaupt
                ein Fernseher verbunden ist.
              */}
              {tv?.isActive && (
                <button
                  type="button"
                  onClick={() => { haptics.light(); onShowOnTv?.(); }}
                  className="cursor-pointer flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#8ff5ff]/22 bg-[#8ff5ff]/8 text-sm font-bold text-[#9bf7ff] transition-colors"
                >
                  <Tv className="w-4 h-4" aria-hidden />
                  {t("nativeExtra.partyNight.showOnTv")}
                </button>
              )}

              <button
                type="button"
                onClick={() => { haptics.light(); onPause(); }}
                className="cursor-pointer flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-bold text-white/50 transition-colors active:bg-white/[0.07]"
              >
                <Pause className="w-4 h-4" aria-hidden />
                {t("nativeExtra.partyNight.pause")}
              </button>
              <p className="text-center text-[10px] font-medium text-white/32">
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
    </NativeOverlayPortal>
  );
}
