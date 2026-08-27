/**
 * PartyStandingsList — die Gesamtwertung eines Party-Abends als Liste.
 *
 * Der Kern ist die Bewegung: Wer aufgestiegen ist, MUSS man sehen, ohne die
 * Zahlen zu lesen. Darum bewegt `layout` die Zeilen physisch an ihre neue
 * Position, und Pfeil plus Punktzuwachs erklaeren die Bewegung. Es gibt
 * bewusst keine Dauerschleife — jeder Effekt ist ein einmaliger Auftritt,
 * damit das Telefon den Abend ueberlebt.
 *
 * Verwendet von PartyInterstitial, PartyLobbyScreen und PartyFinaleOverlay.
 */
import { motion, useReducedMotion } from "framer-motion";
import { ChevronUp, ChevronDown, Crown, Flame, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PartyStanding } from "@/games/tv/party-types";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface PartyStandingsListProps {
  standings: PartyStanding[];
  /** Punkte aus dem gerade beendeten Spiel, nach Spieler-ID. */
  gained?: Record<string, number>;
  /** Rangwechsel-Pfeile zeigen — nur direkt nach einem Spiel aussagekraeftig. */
  showDelta?: boolean;
  /** Schmalere Zeilen fuer die Lobby. */
  compact?: boolean;
  className?: string;
}

/** Positiv = Plaetze gutgemacht (kleinere Rangzahl ist besser). */
function rankDelta(standing: PartyStanding): number {
  if (standing.prevRank === null) return 0;
  return standing.prevRank - standing.rank;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-xl border border-[#FFD75E]/35 bg-[#FFD75E]/12 shadow-[0_0_22px_-8px_rgba(255,215,94,.8)]">
        <Crown className="h-4.5 w-4.5 text-[#FFD75E]" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid h-8 w-8 place-items-center rounded-xl border text-xs font-black tabular-nums",
        rank === 2
          ? "border-[#D9E1F2]/25 bg-[#D9E1F2]/8 text-[#D9E1F2]"
          : rank === 3
          ? "border-[#E99A67]/25 bg-[#E99A67]/8 text-[#E99A67]"
          : "border-white/[0.07] bg-white/[0.035] text-white/35"
      )}
    >
      {String(rank).padStart(2, "0")}
    </span>
  );
}

export function PartyStandingsList({
  standings,
  gained,
  showDelta = false,
  compact = false,
  className,
}: PartyStandingsListProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  return (
    <div className={cn("space-y-2.5", className)}>
      {standings.map((standing, index) => {
        const delta = showDelta ? rankDelta(standing) : 0;
        const points = gained?.[standing.id] ?? 0;
        const leader = standing.rank === 1;

        return (
          <motion.div
            key={standing.id}
            layout={reduce ? false : "position"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0.15 } : { ...spring.soft, delay: index * 0.06 }}
            className={cn(
              "relative flex items-center gap-2.5 overflow-hidden rounded-[20px] border text-white shadow-[inset_0_1px_0_rgba(255,255,255,.055)]",
              compact ? "min-h-[54px] px-2.5 py-2" : "min-h-[64px] px-3 py-2.5",
              leader
                ? "border-[#FFD75E]/28 bg-[linear-gradient(105deg,rgba(255,215,94,.14),rgba(223,142,255,.08)_55%,rgba(255,255,255,.035))]"
                : delta > 0
                ? "border-[#26E0C4]/22 bg-[linear-gradient(105deg,rgba(38,224,196,.09),rgba(255,255,255,.035))]"
                : "border-white/[0.075] bg-white/[0.038]"
            )}
          >
            <span
              aria-hidden
              className="absolute inset-y-3 left-0 w-0.5 rounded-full"
              style={{
                background: leader ? "#FFD75E" : delta > 0 ? "#26E0C4" : standing.color,
                opacity: leader || delta > 0 ? 1 : 0.35,
                boxShadow: leader ? "0 0 14px #FFD75E" : undefined,
              }}
            />
            {/* Aufstiegs-Blitz: EIN Aufleuchten, keine Dauerschleife — ein
                laufender Effekt pro Zeile wuerde den Akku des Abends kosten. */}
            {delta > 0 && !reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-emerald-400/25 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.85, delay: 0.25 + index * 0.06, ease: "easeOut" }}
              />
            )}

            <div className="flex shrink-0 items-center justify-center">
              <RankBadge rank={standing.rank} />
            </div>

            {/* Rangwechsel — die Bewegung IST die Information. */}
            {showDelta && (
              <div className="flex w-6 shrink-0 items-center justify-center">
                {delta > 0 ? (
                  <motion.span
                    className="flex items-center text-emerald-400"
                    initial={reduce ? false : { y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...spring.bouncy, delay: 0.3 + index * 0.06 }}
                    aria-label={t("nativeExtra.partyNight.rankUp", { n: delta })}
                  >
                    <ChevronUp className="w-4 h-4" aria-hidden />
                    <span className="text-[11px] font-bold tabular-nums">{delta}</span>
                  </motion.span>
                ) : delta < 0 ? (
                  <motion.span
                    className="flex items-center text-rose-400"
                    initial={reduce ? false : { y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...spring.bouncy, delay: 0.3 + index * 0.06 }}
                    aria-label={t("nativeExtra.partyNight.rankDown", { n: -delta })}
                  >
                    <ChevronDown className="w-4 h-4" aria-hidden />
                    <span className="text-[11px] font-bold tabular-nums">{-delta}</span>
                  </motion.span>
                ) : (
                  <Minus className="w-3.5 h-3.5 text-muted-foreground/40" aria-hidden />
                )}
              </div>
            )}

            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-black",
                compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"
              )}
              style={{
                background: `linear-gradient(145deg, ${standing.color}55, rgba(7,8,18,.92))`,
                borderColor: standing.color,
                borderWidth: 1.5,
                boxShadow: leader ? `0 0 22px ${standing.color}55` : undefined,
              }}
            >
              {standing.avatar || standing.name.slice(0, 1).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 text-start">
              <p className={cn("truncate font-black text-white", compact ? "text-xs" : "text-sm")}>{standing.name}</p>
              {standing.streak > 1 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff8eb4]">
                  <Flame className="w-3 h-3" aria-hidden />
                  {t("nativeExtra.partyNight.streak", { n: standing.streak })}
                </span>
              )}
            </div>

            {/* Punktzuwachs dieses Spiels */}
            {points > 0 && (
              <motion.span
                className="shrink-0 rounded-full border border-[#26E0C4]/20 bg-[#26E0C4]/10 px-2 py-0.5 text-[10px] font-black tabular-nums text-[#71f5df]"
                initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...spring.bouncy, delay: 0.35 + index * 0.06 }}
                aria-label={t("nativeExtra.partyNight.pointsGained", { n: points })}
              >
                +{points}
              </motion.span>
            )}

            <span className={cn("shrink-0 font-black tabular-nums", compact ? "text-sm" : "text-lg")} style={{ color: leader ? "#FFD75E" : "rgba(255,255,255,.82)" }}>
              {standing.points}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
