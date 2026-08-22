/**
 * PartyResumeBanner — "da war noch was".
 *
 * Zeigt sich beim App-Start, wenn eine Set-Liste mittendrin abgebrochen wurde
 * (App gekillt, Akku leer, Anruf). Der Abend soll bei Spiel 5 weitergehen und
 * nicht bei Spiel 1 anfangen.
 *
 * Sichtbarkeit und Ausblenden liegen in `usePartyResumeState` (eigene Datei), nicht in
 * der Komponente: Der Einhaengeort ersetzt mit demselben Wert seinen eigenen
 * Standard-Knopf. Laege der Zustand in der Komponente, wuerde beim Ausblenden
 * ein Loch entstehen, statt dass der Standard-Knopf zurueckkehrt.
 *
 * Das Ausblenden landet in `sessionStorage`, NICHT in der Sitzung: Der Hinweis
 * verschwindet fuer den Moment, ist beim naechsten App-Start aber wieder da —
 * die Party selbst bleibt in jedem Fall unangetastet.
 */
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, ListMusic, Play, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { derivePartyStandings } from "@/games/party/standings";
import { useHaptics } from "@/hooks/useHaptics";
import { usePartySession } from "@/hooks/usePartySession";
import { playableGames } from "@/lib/playable-games";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface PartyResumeBannerProps {
  /** Das faellige Spiel — aus `usePartyResumeState`. */
  gameId: string;
  /** Weiterspielen. */
  onResume: (gameId: string) => void;
  /** Ausblenden — die `dismiss`-Funktion aus `usePartyResumeState`. */
  onDismiss: () => void;
  /** Optional: statt weiterzuspielen erst in die Lobby. */
  onOpenLobby?: () => void;
  className?: string;
}

export function PartyResumeBanner({
  gameId,
  onResume,
  onDismiss,
  onOpenLobby,
  className,
}: PartyResumeBannerProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const { session } = usePartySession();

  const leaderName = useMemo(() => {
    if (!session || session.gameHistory.length === 0) return null;
    const leader = derivePartyStandings(session.players, session.gameHistory).find(
      (s) => s.rank === 1
    );
    return leader && leader.points > 0 ? leader.name : null;
  }, [session]);

  if (!session) return null;

  const game = playableGames.find((g) => g.id === gameId);
  const gameName = game ? t(game.nameKey) : gameId;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring.soft}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[#df8eff]/25 bg-gradient-to-br from-[#df8eff]/12 via-[#ff6b98]/8 to-transparent p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-[#df8eff]/20 border border-[#df8eff]/30 flex items-center justify-center">
          <ListMusic className="w-5 h-5 text-violet-500 dark:text-[#df8eff]" aria-hidden />
        </span>

        <div className="flex-1 min-w-0 text-start">
          <p className="text-sm font-display font-bold text-foreground">
            {t("nativeExtra.partyNight.resumeTitle")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("nativeExtra.partyNight.resumeProgress", {
              done: session.playlistIndex + 1,
              total: session.playlist.length,
            })}
            {" · "}
            {gameName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-[#f9ca24]" aria-hidden />
            {leaderName
              ? t("nativeExtra.partyNight.resumeLeader", { name: leaderName })
              : t("nativeExtra.partyNight.resumeNobody")}
          </p>
        </div>

        <button
          type="button"
          aria-label={t("nativeExtra.partyNight.dismiss")}
          onClick={() => { haptics.light(); onDismiss(); }}
          className="cursor-pointer shrink-0 w-11 h-11 -m-2 flex items-center justify-center rounded-xl text-muted-foreground active:bg-foreground/10 active:scale-90 transition-all"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={spring.snappy}
          onClick={() => { haptics.medium(); onResume(gameId); }}
          className="cursor-pointer flex-1 min-h-[44px] rounded-2xl bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,142,255,0.3)]"
        >
          <Play className="w-4 h-4" aria-hidden />
          {t("nativeExtra.partyNight.resumeCta")}
        </motion.button>
        {onOpenLobby && (
          <button
            type="button"
            onClick={() => { haptics.light(); onOpenLobby(); }}
            className="cursor-pointer min-h-[44px] px-4 rounded-2xl border border-border text-muted-foreground font-semibold text-sm active:bg-foreground/5 transition-colors"
          >
            {t("nativeExtra.partyNight.openLobby")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
