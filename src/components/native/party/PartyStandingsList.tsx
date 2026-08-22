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
    return <Crown className="w-5 h-5 text-amber-500 dark:text-[#f9ca24]" aria-hidden />;
  }
  return (
    <span
      className={cn(
        "text-sm font-bold tabular-nums",
        rank === 2 ? "text-foreground/70" : rank === 3 ? "text-amber-700" : "text-muted-foreground"
      )}
    >
      {rank}
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
    <div className={cn("space-y-2", className)}>
      {standings.map((standing, index) => {
        const delta = showDelta ? rankDelta(standing) : 0;
        const points = gained?.[standing.id] ?? 0;
        const leader = standing.rank === 1;

        return (
          <motion.div
            key={standing.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0.15 } : { ...spring.soft, delay: index * 0.06 }}
            className={cn(
              "relative flex items-center gap-3 rounded-2xl border overflow-hidden",
              compact ? "p-2.5" : "p-3",
              leader
                ? "bg-[#f9ca24]/10 border-[#f9ca24]/30"
                : delta > 0
                ? "bg-emerald-500/[0.07] border-emerald-500/20"
                : "bg-card border-border"
            )}
          >
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

            <div className="w-6 flex items-center justify-center shrink-0">
              <RankBadge rank={standing.rank} />
            </div>

            {/* Rangwechsel — die Bewegung IST die Information. */}
            {showDelta && (
              <div className="w-6 flex items-center justify-center shrink-0">
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
                "rounded-full flex items-center justify-center shrink-0",
                compact ? "w-8 h-8 text-sm" : "w-9 h-9 text-base"
              )}
              style={{
                backgroundColor: standing.color + "30",
                borderColor: standing.color,
                borderWidth: 2,
              }}
            >
              {standing.avatar || standing.name.slice(0, 1).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 text-start">
              <p className="text-sm font-semibold text-foreground truncate">{standing.name}</p>
              {standing.streak > 1 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-400">
                  <Flame className="w-3 h-3" aria-hidden />
                  {t("nativeExtra.partyNight.streak", { n: standing.streak })}
                </span>
              )}
            </div>

            {/* Punktzuwachs dieses Spiels */}
            {points > 0 && (
              <motion.span
                className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold tabular-nums shrink-0"
                initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...spring.bouncy, delay: 0.35 + index * 0.06 }}
                aria-label={t("nativeExtra.partyNight.pointsGained", { n: points })}
              >
                +{points}
              </motion.span>
            )}

            <span className="text-base font-bold text-foreground tabular-nums shrink-0">
              {standing.points}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
