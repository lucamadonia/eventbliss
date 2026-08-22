/**
 * SetlistTray — die geplante Reihenfolge am unteren Bildschirmrand.
 *
 * Eingeklappt: eine Leiste mit Anzahl, geschaetzter Dauer und Startknopf.
 * Ausgeklappt: die Liste mit Hoch/Runter je Eintrag.
 *
 * Warum Pfeile statt Ziehen? Die Auswahl darueber ist ein Scroll-Container.
 * Ein Ziehgriff braeuchte dort eine Haltezeit zum "Anfassen" — genau die
 * Unsicherheit ("hab ich's jetzt?"), die nachts um elf niemand will. Die
 * Pfeile sind 44px gross, funktionieren in RTL identisch (oben/unten kennt
 * keine Leserichtung) und die Zeile bewegt sich per `layout` trotzdem
 * physisch an ihren neuen Platz — die Bewegung bleibt also sichtbar.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, ListOrdered, Play, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { estimateSetlistMinutes, formatSetlistDuration, type SetlistGame } from "./setlist";

export interface SetlistTrayProps {
  /** Geplante Kennungen in Reihenfolge. */
  ids: string[];
  catalog: Map<string, SetlistGame>;
  playerCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (gameId: string) => void;
  onClear: () => void;
  onStart: () => void;
}

export function SetlistTray({
  ids,
  catalog,
  playerCount,
  expanded,
  onToggleExpanded,
  onMove,
  onRemove,
  onClear,
  onStart,
}: SetlistTrayProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduce = useReducedMotion();

  const minutes = estimateSetlistMinutes(ids, playerCount);
  const canStart = ids.length > 0;

  const handleMove = (index: number, delta: number) => {
    haptics.select();
    onMove(index, delta);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      {/* Ausgeklappte Reihenfolge */}
      <AnimatePresence initial={false}>
        {expanded && ids.length > 0 && (
          <motion.div
            key="order"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={spring.snappy}
            className="mx-3 mb-2 max-h-[46vh] overflow-y-auto native-scroll rounded-3xl border border-border bg-background/95 backdrop-blur-2xl p-2 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("nativeExtra.partyNight.order")}
              </span>
              <button
                type="button"
                onClick={() => { haptics.light(); onClear(); }}
                className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 active:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
                {t("nativeExtra.partyNight.clear")}
              </button>
            </div>

            <div className="space-y-1.5">
              {ids.map((id, index) => {
                const game = catalog.get(id);
                return (
                  <motion.div
                    key={id}
                    layout={!reduce}
                    transition={spring.snappy}
                    className="flex items-center gap-2 rounded-2xl bg-card border border-border p-2"
                  >
                    <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#df8eff] to-[#ff6b98] text-white text-xs font-bold flex items-center justify-center tabular-nums">
                      {index + 1}
                    </span>
                    <span className="flex-1 min-w-0 text-start text-sm font-semibold text-foreground truncate">
                      {game ? t(game.nameKey) : id}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {game ? Math.round(game.minutes) : "–"}′
                    </span>

                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        aria-label={t("nativeExtra.partyNight.moveUp")}
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                        className="cursor-pointer w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground active:bg-foreground/10 active:scale-90 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t("nativeExtra.partyNight.moveDown")}
                        disabled={index === ids.length - 1}
                        onClick={() => handleMove(index, 1)}
                        className="cursor-pointer w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground active:bg-foreground/10 active:scale-90 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t("nativeExtra.partyNight.remove")}
                        onClick={() => { haptics.light(); onRemove(id); }}
                        className="cursor-pointer w-11 h-11 flex items-center justify-center rounded-xl text-rose-400 active:bg-rose-500/10 active:scale-90 transition-all"
                      >
                        <X className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leiste */}
      <div className="border-t border-border bg-background/95 backdrop-blur-2xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { haptics.light(); onToggleExpanded(); }}
            disabled={ids.length === 0}
            className="cursor-pointer flex-1 min-w-0 flex items-center gap-2.5 h-11 px-2 rounded-xl text-start active:bg-foreground/5 transition-colors disabled:opacity-60 disabled:cursor-default"
          >
            <span className="relative shrink-0 w-9 h-9 rounded-xl bg-[#df8eff]/15 border border-[#df8eff]/25 flex items-center justify-center">
              <ListOrdered className="w-4 h-4 text-violet-500 dark:text-[#df8eff]" aria-hidden />
              {ids.length > 0 && (
                <motion.span
                  key={ids.length}
                  initial={reduce ? false : { scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={spring.bouncy}
                  className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff6b98] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
                >
                  {ids.length}
                </motion.span>
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-foreground truncate">
                {ids.length === 0
                  ? t("nativeExtra.partyNight.emptyTray")
                  : t("nativeExtra.partyNight.trayCount", { n: ids.length })}
              </span>
              {ids.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" aria-hidden />
                  {formatSetlistDuration(minutes, t)}
                </span>
              )}
            </span>
            {ids.length > 0 && (
              <ChevronUp
                className={cn(
                  "w-4 h-4 shrink-0 text-muted-foreground transition-transform",
                  expanded && "rotate-180"
                )}
                aria-hidden
              />
            )}
          </button>

          <motion.button
            type="button"
            whileTap={canStart ? { scale: 0.95 } : undefined}
            transition={spring.snappy}
            onClick={() => { haptics.medium(); onStart(); }}
            disabled={!canStart}
            className={cn(
              "cursor-pointer h-12 px-5 rounded-2xl font-bold text-sm flex items-center gap-2 shrink-0 transition-all",
              canStart
                ? "bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#f9ca24] text-white shadow-[0_0_24px_rgba(223,142,255,0.35)]"
                : "bg-foreground/5 text-muted-foreground border border-border cursor-not-allowed"
            )}
          >
            <Play className="w-4 h-4" aria-hidden />
            {t("nativeExtra.partyNight.start")}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
