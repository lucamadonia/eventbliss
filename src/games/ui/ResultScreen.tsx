import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronRight, Crown, Flame, PartyPopper, Play, Sparkles } from "lucide-react";

import { ConfettiBurst } from "@/components/vfx/ConfettiBurst";
import { haptics } from "@/hooks/useHaptics";
import { isPartySessionActive } from "@/hooks/usePartySession";
import TVPartyPodium from "@/games/tv/components/TVPartyPodium";
import type { PartyStanding } from "@/games/tv/party-types";
import { getPlayerColor } from "./PlayerAvatars";

interface ResultPlayer {
  name: string;
  score: number;
  streak: number;
}

interface ResultScreenProps {
  players: ResultPlayer[];
  gameTitle: string;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  totalRounds?: number;
  gameId?: string;
}

interface ResultTheme {
  accent: string;
  secondary: string;
  warm: string;
  background: string;
}

const RESULT_THEMES: Record<string, ResultTheme> = {
  brew: { accent: "#df8eff", secondary: "#8ff5ff", warm: "#FFD75E", background: "#070812" },
  pixeljagd: { accent: "#38BDF8", secondary: "#FDE047", warm: "#FB7185", background: "#07101e" },
  closeenough: { accent: "#A78BFA", secondary: "#22D3EE", warm: "#FBBF24", background: "#090b19" },
};

const DEFAULT_THEME: ResultTheme = {
  accent: "#df8eff",
  secondary: "#8ff5ff",
  warm: "#FFD75E",
  background: "#070812",
};

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Premium-Spielabschluss fuer das Telefon.
 *
 * Der Screen unterscheidet bewusst zwischen einem Einzelspiel und einer
 * laufenden Party Night. Im Einzelspiel ist "noch einmal" die Hauptaktion;
 * innerhalb der Set-Liste fuehrt die Hauptaktion zur Gesamtwertung und zum
 * naechsten Spiel. Die grosse Party-Siegerehrung bleibt dem Finale vorbehalten.
 */
export function ResultScreen({
  players,
  gameTitle,
  onPlayAgain,
  onBackToHub,
  totalRounds,
  gameId,
}: ResultScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduce = !!useReducedMotion();
  const partyActive = isPartySessionActive();
  const theme = RESULT_THEMES[gameId ?? ""] ?? DEFAULT_THEME;

  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const winner = sorted[0];
  const bestRound = sorted.length ? Math.max(...sorted.map((player) => player.score)) : 0;
  const longestStreak = sorted.length ? Math.max(...sorted.map((player) => player.streak), 0) : 0;

  const podium = useMemo<PartyStanding[]>(
    () => sorted.map((player, index) => ({
      id: `${player.name}-${index}`,
      name: player.name,
      color: getPlayerColor(index),
      points: player.score,
      rank: index + 1,
      prevRank: null,
      gamesWon: index === 0 ? 1 : 0,
      streak: player.streak,
    })),
    [sorted],
  );

  const [beat, setBeat] = useState(reduce ? 3 : 0);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    haptics.celebrate();
    if (reduce) {
      setBeat(3);
      setConfetti(false);
      return;
    }

    setBeat(0);
    const timers = [
      window.setTimeout(() => {
        setBeat(1);
        setConfetti(true);
      }, 180),
      window.setTimeout(() => setBeat(2), 760),
      window.setTimeout(() => setBeat(3), 1180),
      window.setTimeout(() => setConfetti(false), 1650),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reduce]);

  if (!winner) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#070812] px-6 text-white">
        <button type="button" onClick={onBackToHub} className="min-h-12 rounded-2xl border border-white/15 px-5 font-bold">
          {t("games.results.otherGame")}
        </button>
      </div>
    );
  }

  const primaryAction = () => {
    haptics.medium();
    if (partyActive) navigate("/party");
    else onPlayAgain();
  };

  const secondaryAction = () => {
    haptics.light();
    if (partyActive) onPlayAgain();
    else onBackToHub();
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden text-white"
      style={{ background: theme.background }}
    >
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(${theme.accent}10 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}10 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
            maskImage: "radial-gradient(circle at 50% 34%, black, transparent 74%)",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-[24%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[95px]"
          style={{ background: `${theme.accent}32` }}
          initial={{ opacity: 0, scale: reduce ? 1 : 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduce ? 0.1 : 0.9, ease: easeOut }}
        />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/35 to-transparent" />
      </div>

      <ConfettiBurst active={confetti} count={42} />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <motion.header
          className="flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: reduce ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.1 : 0.4, ease: easeOut }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: theme.secondary }}>
              {partyActive ? <PartyPopper className="h-3.5 w-3.5" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
              <span>{partyActive ? t("tv.partyNight.title") : t("games.results.gameOver")}</span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-white/55">{gameTitle}</p>
          </div>
          <div className="rounded-full border border-white/12 bg-white/[0.055] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/50 backdrop-blur-xl">
            {t("games.results.winner")}
          </div>
        </motion.header>

        <section className="mt-1 flex-1">
          <TVPartyPodium
            entries={podium}
            reveal={beat >= 1}
            variant="finale"
            compact
            className="mx-auto max-w-[25rem]"
          />

          <motion.div
            className="mx-auto -mt-1 flex max-w-sm items-center justify-center gap-2 rounded-full border px-4 py-2 text-center"
            style={{
              borderColor: `${theme.warm}48`,
              background: `linear-gradient(90deg, transparent, ${theme.warm}16, transparent)`,
            }}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={beat >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 12 }}
            transition={{ duration: reduce ? 0.1 : 0.42, ease: easeOut }}
          >
            <Crown className="h-4 w-4 shrink-0" style={{ color: theme.warm }} aria-hidden />
            <p className="min-w-0 truncate text-sm font-black">
              {winner.name} · {t("games.results.winnerPoints", { n: winner.score })}
            </p>
          </motion.div>

          <motion.section
            className="mt-6 overflow-hidden rounded-[26px] border border-white/[0.09] bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl"
            initial={{ opacity: 0, y: reduce ? 0 : 18 }}
            animate={beat >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 18 }}
            transition={{ duration: reduce ? 0.1 : 0.48, ease: easeOut }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <h2 className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                {t("games.results.leaderboard")}
              </h2>
              <span className="text-[10px] font-bold tabular-nums text-white/35">{sorted.length}</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {sorted.map((player, index) => {
                const color = getPlayerColor(index);
                return (
                  <motion.div
                    key={`${player.name}-${index}`}
                    className="relative flex min-h-[58px] items-center gap-3 px-3.5 py-2.5"
                    initial={{ opacity: 0, x: reduce ? 0 : -14 }}
                    animate={beat >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: reduce ? 0 : -14 }}
                    transition={{ duration: reduce ? 0.1 : 0.35, delay: reduce ? 0 : Math.min(index * 0.055, 0.3), ease: easeOut }}
                  >
                    {index === 0 && <div className="absolute inset-y-2 left-0 w-0.5 rounded-full" style={{ background: theme.warm, boxShadow: `0 0 12px ${theme.warm}` }} />}
                    <span className="w-6 shrink-0 text-center text-sm font-black tabular-nums" style={{ color: index < 3 ? [theme.warm, "#D9E1F2", "#E99A67"][index] : "rgba(255,255,255,.35)" }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black"
                      style={{ background: `${color}2e`, border: `1.5px solid ${color}9c`, boxShadow: index === 0 ? `0 0 20px ${color}48` : undefined }}
                    >
                      {player.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{player.name}</span>
                    {player.streak >= 3 && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ff6b98]/12 px-2 py-1 text-[10px] font-black text-[#ff8eb4]">
                        <Flame className="h-3 w-3" aria-hidden />
                        {player.streak}
                      </span>
                    )}
                    <span className="shrink-0 text-base font-black tabular-nums" style={{ color: index === 0 ? theme.warm : "rgba(255,255,255,.78)" }}>
                      {player.score}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            className="mt-3 grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={beat >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 12 }}
            transition={{ duration: reduce ? 0.1 : 0.42, ease: easeOut }}
          >
            {[
              { label: t("games.results.rounds"), value: totalRounds ?? "–" },
              { label: t("games.results.bestPoints"), value: bestRound },
              { label: t("games.results.longestStreak"), value: longestStreak },
            ].map((stat, index) => (
              <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] px-2 py-3 text-center">
                <div className="absolute inset-x-4 top-0 h-px" style={{ background: index === 0 ? theme.accent : index === 1 ? theme.secondary : theme.warm }} />
                <p className="text-lg font-black tabular-nums">{stat.value}</p>
                <p className="mt-0.5 line-clamp-2 text-[8px] font-black uppercase leading-tight tracking-[0.12em] text-white/38">{stat.label}</p>
              </div>
            ))}
          </motion.section>
        </section>

        <motion.footer
          className="sticky bottom-0 -mx-4 mt-5 grid grid-cols-[.82fr_1.35fr] gap-2 border-t border-white/[0.07] bg-[#070812]/90 px-4 pb-[calc(.25rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl"
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={beat >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 24 }}
          transition={{ duration: reduce ? 0.1 : 0.45, ease: easeOut }}
        >
          <motion.button
            type="button"
            onClick={secondaryAction}
            whileTap={{ scale: 0.97 }}
            className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.045] px-3 text-xs font-black text-white/66"
          >
            {partyActive ? <Play className="h-4 w-4" aria-hidden /> : <ArrowLeft className="h-4 w-4" aria-hidden />}
            <span className="truncate">{partyActive ? t("games.results.playAgain") : t("games.results.otherGame")}</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={primaryAction}
            whileTap={{ scale: 0.97 }}
            className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black text-[#080914] shadow-[0_18px_42px_-22px_rgba(223,142,255,.9)]"
            style={{ background: `linear-gradient(105deg, ${theme.secondary}, ${theme.accent} 52%, ${theme.warm})` }}
          >
            {partyActive ? <PartyPopper className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            <span className="truncate">{partyActive ? t("games.results.toParty") : t("games.results.playAgain")}</span>
            <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
          </motion.button>
        </motion.footer>
      </main>
    </div>
  );
}
