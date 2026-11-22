import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Eye, Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { playableGames, type PlayableGame } from "@/lib/playable-games";
import { gameFlagKey } from "@/lib/app-switches";
import { GameTile, GameTileSkeleton } from "./GameTile";
import type { SwitchSpec } from "./useVisibilityFlags";

type Filter = "all" | "visible" | "hidden" | "free" | "premium";

interface Props {
  isLoading: boolean;
  hiddenKeys: ReadonlySet<string>;
  onChange: (specs: SwitchSpec[], hidden: boolean) => Promise<boolean>;
}

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function GameSwitches({ isLoading, hiddenKeys, onChange }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmShowAll, setConfirmShowAll] = useState(false);

  // "/" jumps into the search from anywhere on the tab.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isHidden = (game: PlayableGame) => hiddenKeys.has(gameFlagKey(game.id));
  const specFor = (game: PlayableGame): SwitchSpec => ({
    key: gameFlagKey(game.id),
    name: `Spiel ausblenden: ${t(game.nameKey)}`,
    description: `Blendet das Spiel „${t(game.nameKey)}“ (${game.id}) in der Spielauswahl aus.`,
  });

  const hiddenCount = playableGames.filter(isHidden).length;

  const counts: Record<Filter, number> = {
    all: playableGames.length,
    visible: playableGames.length - hiddenCount,
    hidden: hiddenCount,
    free: playableGames.filter((game) => game.tier === "free").length,
    premium: playableGames.filter((game) => game.tier === "premium").length,
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return playableGames.filter((game) => {
      const hidden = hiddenKeys.has(gameFlagKey(game.id));
      if (filter === "visible" && hidden) return false;
      if (filter === "hidden" && !hidden) return false;
      if ((filter === "free" || filter === "premium") && game.tier !== filter) return false;
      return !q || t(game.nameKey).toLowerCase().includes(q) || game.id.includes(q);
    });
  }, [query, filter, hiddenKeys, t]);

  /** Single toggles are never confirmed; the toast offers the way back instead. */
  const setVisible = async (game: PlayableGame, visible: boolean, undoable = true) => {
    if (!(await onChange([specFor(game)], !visible))) return;
    const name = t(game.nameKey);
    const message = visible
      ? t("admin.visibility.nowVisible", "{{name}} ist wieder sichtbar", { name })
      : t("admin.visibility.nowHidden", "{{name}} ist ausgeblendet", { name });
    toast.success(message, undoable
      ? { action: { label: t("admin.visibility.undo", "Rückgängig"), onClick: () => void setVisible(game, !visible, false) } }
      : undefined);
  };

  const showAll = async () => {
    setConfirmShowAll(false);
    if (await onChange(playableGames.filter(isHidden).map(specFor), false)) {
      toast.success(t("admin.visibility.games.allVisible", "Alle Spiele sind wieder sichtbar"));
    }
  };

  const resetView = () => { setQuery(""); setFilter("all"); };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("admin.visibility.games.filterAll", "Alle") },
    { id: "visible", label: t("admin.visibility.visible", "Sichtbar") },
    { id: "hidden", label: t("admin.visibility.hidden", "Ausgeblendet") },
    { id: "free", label: t("admin.visibility.games.free", "Free") },
    { id: "premium", label: t("admin.visibility.games.premium", "Premium") },
  ];

  return (
    <section aria-labelledby="visibility-games" className="space-y-4">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h3 id="visibility-games" className="text-lg font-bold tracking-tight">{t("admin.visibility.games.title", "Spiele")}</h3>
        {hiddenCount > 0 && (
          <Button variant="ghost" className="min-h-11 gap-2" onClick={() => setConfirmShowAll(true)}>
            <Eye className="h-4 w-4" aria-hidden />
            {t("admin.visibility.games.showAll", "Alle einblenden")}
          </Button>
        )}
      </div>

      {/* Sticks right below the admin header (61px + notch); bleeds into the page gutter so tiles never peek out beside it. */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+61px)] z-[5] -mx-6 space-y-2 border-b bg-background/90 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            ref={searchRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") { setQuery(""); event.currentTarget.blur(); } }}
            placeholder={t("admin.visibility.games.search", "Spiel suchen")}
            aria-label={t("admin.visibility.games.search", "Spiel suchen")}
            aria-keyshortcuts="/"
            className="h-12 rounded-xl pl-10 pr-12 text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => { setQuery(""); searchRef.current?.focus(); }}
              aria-label={t("admin.visibility.games.clearSearch", "Suche leeren")}
              className="absolute right-0.5 top-0.5 grid h-11 w-11 place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <kbd aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground md:block">/</kbd>
          )}
        </div>

        {/* One row that scrolls inside itself on narrow phones; the page never scrolls sideways. */}
        <div role="group" aria-label={t("admin.visibility.games.filter", "Spiele filtern")} className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 py-0.5">
          {filters.map((entry) => {
            const active = filter === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(entry.id)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.label}
                {!isLoading && <span className={cn("tabular-nums text-xs", active ? "opacity-90" : "opacity-70")}>{counts[entry.id]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isLoading ? "" : t("admin.visibility.games.resultCount", "{{count}} Spiele in der Liste", { count: shown.length })}
      </p>

      {isLoading ? (
        <div className={GRID} aria-busy="true" aria-label={t("admin.visibility.games.loading", "Spiele werden geladen")}>
          {Array.from({ length: 10 }, (_, index) => <GameTileSkeleton key={index} />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">
              {query.trim()
                ? t("admin.visibility.games.emptySearch", "Kein Spiel heißt „{{query}}“", { query: query.trim() })
                : filter === "hidden"
                  ? t("admin.visibility.games.emptyHidden", "Kein Spiel ist ausgeblendet")
                  : t("admin.visibility.games.empty", "Kein Spiel in dieser Auswahl")}
            </p>
            <p className="text-sm text-muted-foreground">
              {query.trim()
                ? t("admin.visibility.games.emptySearchHint", "Prüfe die Schreibweise oder suche nach einem Teil des Namens.")
                : t("admin.visibility.games.emptyHint", "Alle Spiele sind gerade für Spieler sichtbar.")}
            </p>
          </div>
          <Button variant="outline" className="min-h-11" onClick={resetView}>
            {t("admin.visibility.games.resetView", "Alle Spiele zeigen")}
          </Button>
        </div>
      ) : (
        <ul className={cn(GRID, "relative")}>
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((game) => (
              <motion.li
                key={game.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              >
                <GameTile game={game} hidden={isHidden(game)} onToggle={(visible) => void setVisible(game, visible)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AlertDialog open={confirmShowAll} onOpenChange={setConfirmShowAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.visibility.games.confirmTitle", "Alle {{count}} ausgeblendeten Spiele wieder einblenden?", { count: hiddenCount })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.visibility.games.confirmText", "Sie erscheinen wieder in der Spielauswahl auf der Website und in der App. Einzelne Spiele kannst du danach jederzeit erneut ausblenden.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">{t("common.cancel", "Abbrechen")}</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={() => void showAll()}>
              {t("admin.visibility.games.showAll", "Alle einblenden")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
