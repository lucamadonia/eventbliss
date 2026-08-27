/**
 * PartyFinaleOverlay — die grosse Siegerehrung auf dem Telefon.
 *
 * Anders als der Zwischenstand zeigt dieser Screen keine Rangbewegung und
 * keinen naechsten Programmpunkt. Er schliesst die Nacht mit Champion-Buehne,
 * persönlichen Awards, Endtabelle und einer einzigen Abschlussaktion.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloudRain, Target, TrendingUp, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { ConfettiBurst } from "@/components/vfx/ConfettiBurst";
import type { GameHistoryEntry } from "@/games/party/session-schema";
import TVPartyPodium from "@/games/tv/components/TVPartyPodium";
import { computePartyAwards } from "@/games/tv/partyAwards";
import type { PartyAward, PartyAwardKey } from "@/games/tv/partyAwards";
import type { PartyStanding } from "@/games/tv/party-types";

import { PartyStandingsList } from "./PartyStandingsList";

export interface PartyFinaleOverlayProps {
  open: boolean;
  standings: PartyStanding[];
  history: GameHistoryEntry[];
  gamesPlayed: number;
  playerCount: number;
  onDone: () => void;
}

const AWARD_META: Record<PartyAwardKey, { icon: LucideIcon; color: string }> = {
  comeback: { icon: TrendingUp, color: "#26E0C4" },
  mostWins: { icon: Trophy, color: "#FFD75E" },
  consistency: { icon: Target, color: "#8ff5ff" },
  bestGame: { icon: Zap, color: "#df8eff" },
  unlucky: { icon: CloudRain, color: "#ff6b98" },
};

function AwardTile({ award, player, index, reveal }: { award: PartyAward; player: PartyStanding; index: number; reveal: boolean }) {
  const { t } = useTranslation();
  const meta = AWARD_META[award.key];
  const Icon = meta.icon;
  const detail = (() => {
    switch (award.key) {
      case "comeback":
        return t("tv.partyNight.award.comeback.detail", { from: award.from, to: award.to });
      case "mostWins":
        return t("tv.partyNight.award.mostWins.detail", { n: award.value });
      case "consistency":
        return t("tv.partyNight.award.consistency.detail", {
          value: award.value.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        });
      case "bestGame":
        return t("tv.partyNight.award.bestGame.detail", { value: award.value, game: award.gameName ?? "" });
      case "unlucky":
        return t("tv.partyNight.award.unlucky.detail", { n: award.value });
    }
  })();

  return (
    <motion.div
      className="relative overflow-hidden rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-3"
      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 16px 40px -30px ${meta.color}` }}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={reveal ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.96 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-x-5 top-0 h-px" style={{ background: meta.color }} aria-hidden />
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}38` }}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: meta.color }}>
            {t(`tv.partyNight.award.${award.key}.title`)}
          </p>
          <p className="mt-0.5 truncate text-sm font-black text-white">
            {player.avatar ? `${player.avatar} ` : ""}{player.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-semibold text-white/40">{detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function PartyFinaleOverlay({
  open,
  standings,
  history,
  gamesPlayed,
  playerCount,
  onDone,
}: PartyFinaleOverlayProps) {
  const { t } = useTranslation();
  const reduce = !!useReducedMotion();
  const champion = standings[0];
  const byId = useMemo(() => new Map(standings.map((standing) => [standing.id, standing])), [standings]);
  const awards = useMemo(
    () => champion
      ? computePartyAwards(history, standings.map((standing) => standing.id), { excludeIds: [champion.id], max: 3 })
      : [],
    [champion, history, standings],
  );
  const [beat, setBeat] = useState(reduce ? 3 : 0);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (!open) {
      setBeat(0);
      setConfetti(false);
      return;
    }
    if (reduce) {
      setBeat(3);
      return;
    }
    const timers = [
      window.setTimeout(() => {
        setBeat(1);
        setConfetti(true);
      }, 220),
      window.setTimeout(() => setBeat(2), 900),
      window.setTimeout(() => setBeat(3), 1320),
      window.setTimeout(() => setConfetti(false), 1750),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [open, reduce]);

  return (
    <NativeOverlayPortal>
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#060810] text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.28 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="party-finale-title"
          >
            <div className="fixed inset-0 pointer-events-none" aria-hidden>
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(223,142,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,245,255,.05) 1px,transparent 1px)", backgroundSize: "30px 30px", maskImage: "radial-gradient(circle at 50% 30%,black,transparent 72%)" }} />
              <motion.div
                className="absolute left-1/2 top-[18%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f9ca24]/18 blur-[105px]"
                initial={{ opacity: 0, scale: reduce ? 1 : 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduce ? 0.1 : 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="absolute -bottom-32 -left-28 h-72 w-72 rounded-full bg-[#df8eff]/12 blur-[100px]" />
              <div className="absolute -bottom-32 -right-28 h-72 w-72 rounded-full bg-[#8ff5ff]/10 blur-[100px]" />
            </div>

            <ConfettiBurst active={confetti} count={54} />

            <div className="relative z-10 flex-1 overflow-y-auto native-scroll px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1.2rem+env(safe-area-inset-top))]">
              <div className="mx-auto w-full max-w-md">
                <motion.header
                  className="text-center"
                  initial={{ opacity: 0, y: reduce ? 0 : -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0.1 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD75E]">
                    {t("tv.partyNight.finaleEyebrow")}
                  </p>
                  <h2 id="party-finale-title" className="mt-1 text-[clamp(1.9rem,8vw,2.55rem)] font-display font-black leading-[1.02] tracking-[-0.04em]">
                    {t("tv.partyNight.champion")}
                  </h2>
                  <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-white/45">
                    {t("nativeExtra.partyLobby.finalSummary", { games: gamesPlayed, players: playerCount })}
                  </p>
                </motion.header>

                <TVPartyPodium entries={standings} reveal={beat >= 1} variant="finale" compact className="mt-1" />

                {champion && (
                  <motion.div
                    className="mx-auto mt-2 flex max-w-sm items-center justify-center gap-2 rounded-full border border-[#FFD75E]/25 bg-[#FFD75E]/8 px-4 py-2.5"
                    initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                    animate={beat >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 12 }}
                    transition={{ duration: reduce ? 0.1 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Trophy className="h-4 w-4 shrink-0 text-[#FFD75E]" aria-hidden />
                    <p className="truncate text-sm font-black">
                      {t("tv.partyNight.championLine", { name: champion.name, points: champion.points.toLocaleString("de-DE") })}
                    </p>
                  </motion.div>
                )}

                {awards.length > 0 && (
                  <section className="mt-6">
                    <h3 className="mb-2.5 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                      {t("tv.partyNight.awardsTitle")}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {awards.map((award, index) => {
                        const player = byId.get(award.playerId);
                        return player ? <AwardTile key={award.key} award={award} player={player} index={index} reveal={beat >= 2} /> : null;
                      })}
                    </div>
                  </section>
                )}

                <motion.section
                  className="mt-6"
                  initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                  animate={beat >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 14 }}
                  transition={{ duration: reduce ? 0.1 : 0.44, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3 className="mb-2.5 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                    {t("tv.partyNight.finalTable")}
                  </h3>
                  <PartyStandingsList standings={standings} compact />
                </motion.section>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onDone}
                  className="mt-5 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8ff5ff] via-[#df8eff] to-[#FFD75E] px-5 text-base font-black text-[#070812] shadow-[0_22px_55px_-28px_rgba(223,142,255,.95)]"
                  initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                  animate={beat >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 16 }}
                  transition={{ duration: reduce ? 0.1 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  {t("nativeExtra.partyLobby.done")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
