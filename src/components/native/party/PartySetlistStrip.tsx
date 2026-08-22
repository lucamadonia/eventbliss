/**
 * PartySetlistStrip — der Abendplan in der Lobby.
 *
 * Sichtbar, BEVOR das erste Spiel laeuft: erledigt / jetzt / kommt noch. Die
 * Lobby zeigte bisher erst nach dem ersten Spiel etwas an — mit einer Set-Liste
 * ist genau der Plan das Wertvollste am Anfang des Abends.
 */
import { motion } from "framer-motion";
import { Check, Clock, ListOrdered, Pencil, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useHaptics } from "@/hooks/useHaptics";
import { playableGames } from "@/lib/playable-games";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { estimateSetlistMinutes, formatSetlistDuration } from "./setlist";

export interface PartySetlistStripProps {
  playlist: string[];
  playlistIndex: number;
  playlistActive: boolean;
  playerCount: number;
  /** Set-Liste bearbeiten (oeffnet den Picker). */
  onEdit: () => void;
  /** Das faellige Spiel starten. */
  onPlayCurrent: (gameId: string) => void;
}

export function PartySetlistStrip({
  playlist,
  playlistIndex,
  playlistActive,
  playerCount,
  onEdit,
  onPlayCurrent,
}: PartySetlistStripProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();

  if (playlist.length === 0) return null;

  const remaining = playlist.slice(playlistIndex);

  return (
    <section className="px-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ListOrdered className="w-4 h-4" aria-hidden />
          {t("nativeExtra.partyNight.setlistHeading")}
        </h2>
        <button
          type="button"
          onClick={() => { haptics.light(); onEdit(); }}
          className="cursor-pointer inline-flex items-center gap-1.5 min-h-[44px] px-2 -me-2 text-xs font-semibold text-violet-500 dark:text-[#df8eff] active:opacity-60 transition-opacity"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden />
          {t("nativeExtra.partyNight.editSetlist")}
        </button>
      </div>

      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="w-3 h-3" aria-hidden />
        {formatSetlistDuration(estimateSetlistMinutes(remaining, playerCount), t)}
        {" · "}
        {t("nativeExtra.partyNight.remaining", { n: remaining.length })}
      </p>

      <motion.ol className="space-y-2" variants={stagger} initial="initial" animate="animate">
        {playlist.map((gameId, index) => {
          const game = playableGames.find((g) => g.id === gameId);
          const done = index < playlistIndex;
          const current = playlistActive && index === playlistIndex;

          return (
            <motion.li
              key={`${gameId}-${index}`}
              variants={staggerItem}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-2.5 transition-colors",
                current
                  ? "bg-[#df8eff]/10 border-[#df8eff]/30"
                  : done
                  ? "bg-card/50 border-border opacity-55"
                  : "bg-card border-border"
              )}
            >
              <span
                className={cn(
                  "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums",
                  done
                    ? "bg-emerald-500/15 text-emerald-400"
                    : current
                    ? "bg-gradient-to-br from-[#df8eff] to-[#ff6b98] text-white"
                    : "bg-foreground/5 text-muted-foreground"
                )}
              >
                {done ? <Check className="w-4 h-4" aria-hidden /> : index + 1}
              </span>

              <span className="flex-1 min-w-0 text-start">
                <span
                  className={cn(
                    "block text-sm font-semibold truncate",
                    done ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {game ? t(game.nameKey) : gameId}
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  {done
                    ? t("nativeExtra.partyNight.setlistDoneLabel")
                    : current
                    ? t("nativeExtra.partyNight.setlistCurrentLabel")
                    : t("nativeExtra.partyNight.setlistUpcomingLabel")}
                </span>
              </span>

              {current && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  transition={spring.snappy}
                  onClick={() => { haptics.medium(); onPlayCurrent(gameId); }}
                  aria-label={t("nativeExtra.partyNight.continueSetlist", {
                    game: game ? t(game.nameKey) : gameId,
                  })}
                  className="cursor-pointer shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-[#df8eff] to-[#ff6b98] text-white flex items-center justify-center shadow-[0_0_18px_rgba(223,142,255,0.35)]"
                >
                  <Play className="w-4 h-4" aria-hidden />
                </motion.button>
              )}
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
