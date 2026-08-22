/**
 * PartyGamePicker — Auswahl der Spiele fuer einen Party-Abend.
 *
 * Zwei Betriebsarten:
 *   "setlist" — den Abend im Vorfeld planen: antippen reiht ein und stempelt
 *               die Position, nochmal antippen entfernt und nummeriert neu.
 *   "single"  — ein einzelnes Spiel sofort starten (der bisherige Weg,
 *               unveraendert).
 *
 * Der Katalog kommt aus `@/lib/playable-games`; die frueher hier gepflegte
 * Kopie war bereits veraltet (OHRWURM fehlte).
 *
 * Premium wird VORAB geprueft: Ein Spiel, dessen Gratis-Runden fuer heute
 * aufgebraucht sind, laesst sich gar nicht erst einplanen. Niemand soll um
 * 23 Uhr bei Spiel 5 vor einer Bezahlschranke stehen.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Crown, Lock, Search, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { NativeOverlayPortal } from "@/components/native/NativeOverlayPortal";
import { SetlistTray } from "@/components/native/party/SetlistTray";
import {
  buildSetlistCatalog,
  findLockedSetlistEntries,
  moveSetlistEntry,
  setlistCatalogIndex,
  toggleSetlistEntry,
  type SetlistGame,
} from "@/components/native/party/setlist";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { spring, stagger, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type PartyPickerMode = "single" | "setlist";

export interface PartyGamePickerProps {
  open: boolean;
  onClose: () => void;
  /** Ad-hoc: ein einzelnes Spiel sofort starten. */
  onSelectGame: (gameId: string) => void;
  playerCount: number;
  /** Startbetriebsart. Ohne `onStartSetlist` immer "single". */
  mode?: PartyPickerMode;
  /** Vorbelegung beim Oeffnen — eine bestehende Set-Liste bearbeiten. */
  initialSetlist?: string[];
  /** Geplante Reihenfolge uebernehmen und starten. Fehlt sie, gibt es nur Einzelauswahl. */
  onStartSetlist?: (gameIds: string[]) => void;
}

export function PartyGamePicker({
  open,
  onClose,
  onSelectGame,
  playerCount,
  mode = "setlist",
  initialSetlist,
  onStartSetlist,
}: PartyGamePickerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const { isPremium, loading: premiumLoading } = usePremium();

  const planningAvailable = !!onStartSetlist;
  const [planning, setPlanning] = useState(planningAvailable && mode === "setlist");
  const [search, setSearch] = useState("");
  const [ids, setIds] = useState<string[]>(initialSetlist ?? []);
  const [trayExpanded, setTrayExpanded] = useState(false);
  /**
   * Der Premium-Hinweis kennt zwei Anlaesse: eine gesperrte Karte antippen
   * ("card") und der Startknopf, wenn zwischenzeitlich etwas gesperrt wurde
   * ("start").
   */
  const [gate, setGate] = useState<
    { kind: "card"; id: string } | { kind: "start"; ids: string[] } | null
  >(null);

  // Beim Oeffnen frisch aufsetzen: Die Gratis-Runden koennen sich seit dem
  // letzten Oeffnen aufgebraucht haben, und eine alte Auswahl waere verwirrend.
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setGate(null);
    setTrayExpanded(false);
    setIds(initialSetlist ?? []);
    setPlanning(planningAvailable && mode === "setlist");
    // `initialSetlist` bewusst nicht als Abhaengigkeit: Nur das Oeffnen setzt zurueck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, planningAvailable]);

  const catalog = useMemo(
    () => buildSetlistCatalog({ isPremium, premiumUnknown: premiumLoading, playerCount }),
    // `open` bumpt die Gratis-Runden-Zaehlung bei jedem Oeffnen neu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPremium, premiumLoading, playerCount, open]
  );
  const catalogIndex = useMemo(() => setlistCatalogIndex(catalog), [catalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (g) => t(g.nameKey).toLowerCase().includes(q) || t(g.descKey).toLowerCase().includes(q)
    );
  }, [search, catalog, t]);

  const handleTap = (game: SetlistGame) => {
    if (game.locked) {
      haptics.warning();
      setGate({ kind: "card", id: game.id });
      return;
    }
    if (!planning) {
      haptics.medium();
      onSelectGame(game.id);
      return;
    }
    haptics.select();
    setIds((prev) => toggleSetlistEntry(prev, game.id));
  };

  /**
   * Zweite Pruefung beim Start — nicht nur beim Antippen.
   *
   * Zwischen dem Zusammenstellen und dem Startknopf koennen Gratis-Runden
   * verbraucht worden sein (zweite Party auf demselben Geraet) oder der
   * Kalendertag gewechselt haben. Der Katalog ist an dieser Stelle womoeglich
   * veraltet, darum wird frisch aus `gameConfig` gelesen.
   */
  const handleStart = () => {
    if (!onStartSetlist || ids.length === 0) return;
    const blocked = findLockedSetlistEntries(ids, {
      isPremium,
      premiumUnknown: premiumLoading,
    });
    if (blocked.length > 0) {
      haptics.warning();
      setGate({ kind: "start", ids: blocked });
      return;
    }
    onStartSetlist(ids);
  };

  /** Gesperrte Eintraege verwerfen und mit dem Rest weitermachen. */
  const handleStartWithoutBlocked = (blocked: string[]) => {
    const rest = ids.filter((id) => !blocked.includes(id));
    setIds(rest);
    setGate(null);
    if (rest.length > 0 && onStartSetlist) {
      haptics.medium();
      onStartSetlist(rest);
    }
  };

  const gateNames = gate
    ? (gate.kind === "card" ? [gate.id] : gate.ids).map((id) => {
        const game = catalogIndex.get(id);
        return game ? t(game.nameKey) : id;
      })
    : [];

  return (
    <NativeOverlayPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Kopf */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3 safe-top gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-display font-bold text-foreground">
                  {planning ? t("nativeExtra.partyNight.pickTitle") : t("nativeExtra.chooseGame")}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                  <span className="text-xs text-muted-foreground">
                    {t("nativeExtra.partyNight.playersReady", { n: playerCount })}
                  </span>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => { haptics.light(); onClose(); }}
                aria-label={t("common.close", "Schließen")}
                className="cursor-pointer w-11 h-11 shrink-0 rounded-full bg-foreground/5 border border-border flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" aria-hidden />
              </motion.button>
            </div>

            {/* Betriebsart */}
            {planningAvailable && (
              <div className="px-5 pb-3">
                <div className="relative flex p-1 rounded-2xl bg-foreground/5 border border-border">
                  {(["setlist", "single"] as const).map((value) => {
                    const active = planning === (value === "setlist");
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { haptics.select(); setPlanning(value === "setlist"); }}
                        className={cn(
                          "cursor-pointer relative flex-1 min-h-[44px] rounded-xl text-xs font-semibold transition-colors",
                          active ? "text-white" : "text-muted-foreground"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="party-picker-mode"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#df8eff] to-[#ff6b98]"
                            transition={reduce ? { duration: 0 } : spring.snappy}
                          />
                        )}
                        <span className="relative">
                          {value === "setlist"
                            ? t("nativeExtra.partyNight.planEvening")
                            : t("nativeExtra.partyNight.singleGame")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {planning && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t("nativeExtra.partyNight.pickSubtitle")}
                  </p>
                )}
              </div>
            )}

            {/* Suche */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search
                  className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("nativeExtra.partyNight.searchPlaceholder")}
                  className="w-full h-11 ps-9 pe-4 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Raster */}
            <div
              className={cn(
                "flex-1 overflow-y-auto native-scroll",
                planning ? "pb-40" : "pb-[calc(2rem+env(safe-area-inset-bottom))]"
              )}
            >
              <motion.div
                className="px-5 grid grid-cols-2 gap-3"
                variants={stagger}
                initial="initial"
                animate="animate"
              >
                {filtered.map((game) => {
                  const position = planning ? ids.indexOf(game.id) : -1;
                  const picked = position >= 0;

                  return (
                    <motion.button
                      key={game.id}
                      type="button"
                      variants={staggerItem}
                      whileTap={{ scale: game.locked ? 1 : 0.96 }}
                      transition={spring.snappy}
                      onClick={() => handleTap(game)}
                      aria-pressed={planning ? picked : undefined}
                      className={cn(
                        "cursor-pointer relative aspect-[3/4] rounded-2xl overflow-hidden text-start border bg-card transition-all",
                        picked
                          ? "border-[#df8eff] ring-2 ring-[#df8eff]/60 shadow-[0_0_22px_rgba(223,142,255,0.35)]"
                          : "border-border",
                        game.locked && "opacity-50"
                      )}
                    >
                      <div className="absolute inset-0">
                        <img
                          src={game.image}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-br mix-blend-overlay opacity-60",
                            game.gradient
                          )}
                        />
                      </div>

                      {/* Kopfzeile der Karte */}
                      <div className="absolute top-2 inset-x-2 z-10 flex items-start justify-between gap-1">
                        {game.badge ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                              game.badge === "Hot" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                            )}
                          >
                            {game.badge}
                          </span>
                        ) : <span />}

                        {game.locked ? (
                          <span className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-amber-400/40">
                            <Lock className="w-3.5 h-3.5 text-amber-300" aria-hidden />
                          </span>
                        ) : game.isPremiumGame && !isPremium && !premiumLoading ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur border border-amber-400/40 text-[9px] font-bold text-amber-300 tabular-nums">
                            {t("nativeExtra.partyNight.freePlaysLeft", { n: game.freePlaysLeft })}
                          </span>
                        ) : null}
                      </div>

                      {/* Positionsstempel — per Flex zentriert statt ueber
                          links/rechts, damit RTL nichts verschiebt. */}
                      <span className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <AnimatePresence>
                          {picked && (
                            <motion.span
                              key="stamp"
                              initial={reduce ? { opacity: 0 } : { scale: 0.3, opacity: 0, rotate: -25 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              exit={reduce ? { opacity: 0 } : { scale: 0.3, opacity: 0 }}
                              transition={reduce ? { duration: 0.12 } : spring.bouncy}
                              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#df8eff] to-[#ff6b98] text-white text-lg font-display font-black flex items-center justify-center shadow-[0_0_24px_rgba(223,142,255,0.6)] tabular-nums"
                            >
                              {position + 1}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>

                      {/* Titel */}
                      <div className="absolute inset-x-0 bottom-0 z-10 p-3 space-y-0.5">
                        <p className="text-sm font-display font-bold text-white leading-tight drop-shadow-lg">
                          {t(game.nameKey)}
                        </p>
                        <p className="text-[10px] text-white/70 leading-tight line-clamp-2 drop-shadow">
                          {t(game.descKey)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Geplante Reihenfolge */}
            {planning && (
              <SetlistTray
                ids={ids}
                catalog={catalogIndex}
                playerCount={playerCount}
                expanded={trayExpanded}
                onToggleExpanded={() => setTrayExpanded((v) => !v)}
                onMove={(index, delta) => setIds((prev) => moveSetlistEntry(prev, index, delta))}
                onRemove={(gameId) => setIds((prev) => prev.filter((id) => id !== gameId))}
                onClear={() => { setIds([]); setTrayExpanded(false); }}
                onStart={handleStart}
              />
            )}

            {/* Premium-Hinweis — erscheint beim Planen, nicht mitten im Abend. */}
            <AnimatePresence>
              {gate && (
                <motion.div
                  className="absolute inset-0 z-30 bg-background/90 backdrop-blur-xl flex items-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setGate(null)}
                >
                  <motion.div
                    className="w-full rounded-t-3xl border-t border-x border-amber-400/25 bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-3"
                    initial={reduce ? { opacity: 0 } : { y: 220 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { y: 220 }}
                    transition={spring.snappy}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-amber-400" aria-hidden />
                      </span>
                      <div className="min-w-0 text-start">
                        <p className="text-sm font-display font-bold text-foreground">
                          {gate.kind === "start"
                            ? t("nativeExtra.partyNight.blockedTitle")
                            : t("nativeExtra.partyNight.lockedTitle")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {gateNames.join(" · ")}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {gate.kind === "start"
                        ? t("nativeExtra.partyNight.blockedBody")
                        : t("nativeExtra.partyNight.lockedBody")}
                    </p>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { haptics.medium(); navigate("/premium"); }}
                      className="cursor-pointer w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm"
                    >
                      {t("nativeExtra.partyNight.unlockCta")}
                    </motion.button>
                    {gate.kind === "start" && ids.length > gate.ids.length && (
                      <button
                        type="button"
                        onClick={() => handleStartWithoutBlocked(gate.ids)}
                        className="cursor-pointer w-full min-h-[48px] rounded-2xl border border-[#df8eff]/40 text-violet-500 dark:text-[#df8eff] font-semibold text-sm active:bg-[#df8eff]/10 transition-colors"
                      >
                        {t("nativeExtra.partyNight.blockedDropCta")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setGate(null)}
                      className="cursor-pointer w-full min-h-[44px] rounded-2xl border border-border text-muted-foreground font-semibold text-sm active:bg-foreground/5 transition-colors"
                    >
                      {t("nativeExtra.partyNight.notNow")}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeOverlayPortal>
  );
}
