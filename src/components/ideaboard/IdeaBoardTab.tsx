/**
 * IdeaBoardTab — collaborative moodboard ("Ideenboard") for an event.
 * Header with add button + organizer settings, category filter chips, a
 * masonry grid of pins, and the add / detail / settings sheets.
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plus, Settings, Sparkles, FileDown, Loader2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { useIdeaBoard, type BoardPin, type PinCategory } from "@/hooks/useIdeaBoard";
import { Button } from "@/components/ui/button";
import { CATEGORY_LIST } from "./categories";
import { PinCard } from "./PinCard";
import { AddPinSheet } from "./AddPinSheet";
import { PinDetailSheet } from "./PinDetailSheet";
import { BoardSettingsSheet } from "./BoardSettingsSheet";

interface IdeaBoardTabProps {
  event: {
    id: string;
    name: string;
    event_type?: string;
    honoree_name?: string;
    created_by?: string;
  };
}

type CategoryFilter = "all" | PinCategory;

export function IdeaBoardTab({ event }: IdeaBoardTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const b = useIdeaBoard(event.id);

  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailPin, setDetailPin] = useState<BoardPin | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const isOrganizer = !!user?.id && event.created_by === user.id;

  const filtered = useMemo(
    () => (filter === "all" ? b.pins : b.pins.filter((p) => p.category === filter)),
    [b.pins, filter],
  );

  // keep the open detail pin in sync with fresh data (reaction/comment counts)
  const liveDetailPin = useMemo(
    () => (detailPin ? b.pins.find((p) => p.id === detailPin.id) ?? null : null),
    [detailPin, b.pins],
  );

  const handleAi = () => {
    if (!b.isPremium) {
      toast.error(t("ideaBoard.premiumOnly", "Premium-Funktion"));
      return;
    }
    setAiLoading(true);
    haptics.medium();
    b.reload().finally(() => setAiLoading(false));
    toast(t("ideaBoard.aiSoon", "KI-Ideen kommen in Kürze ✨"));
  };

  const handleExport = () => {
    if (!b.isPremium) {
      toast.error(t("ideaBoard.premiumOnly", "Premium-Funktion"));
      return;
    }
    haptics.light();
    window.print();
  };

  const boardTitle = b.board?.title || t("ideaBoard.title", "Ideenboard");

  /* ---- Loading ---- */
  if (b.loading && !b.board) {
    return (
      <div className="flex flex-col gap-4 px-1 pb-28">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-white/10" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
        <div className="columns-2 gap-4 sm:columns-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="mb-4 animate-pulse rounded-2xl bg-white/10"
              style={{ height: 120 + (i % 3) * 60 }}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (b.error && !b.board) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-white/60">
          {t("ideaBoard.error", "Board konnte nicht geladen werden.")}
        </p>
        <Button variant="outline" onClick={() => b.reload()}>
          {t("ideaBoard.retry", "Erneut versuchen")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-5 pb-28">
      {/* ---- Header ---- */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.soft}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/25 via-fuchsia-500/15 to-cyan-500/20 px-4 py-4 backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-white">{boardTitle}</h1>
            <p className="mt-0.5 text-sm text-white/60">
              {t("ideaBoard.pinCount", "{{count}} Ideen", { count: b.pins.length })}
              {!b.isPremium && ` · ${b.myPinCount}/${b.freePinLimit}`}
            </p>
          </div>
          {isOrganizer && b.board && (
            <button
              type="button"
              onClick={() => {
                haptics.light();
                setSettingsOpen(true);
              }}
              aria-label={t("ideaBoard.settings.title", "Board-Einstellungen")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action row */}
        <div className="relative mt-4 flex items-center gap-2">
          <Button
            onClick={() => {
              haptics.medium();
              setAddOpen(true);
            }}
            className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t("ideaBoard.addIdea", "Idee hinzufügen")}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleAi}
            aria-label={t("ideaBoard.aiIdeas", "KI-Ideen")}
            className="shrink-0 bg-white/10 text-white hover:bg-white/20"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleExport}
            aria-label={t("ideaBoard.pdfExport", "PDF-Export")}
            className="shrink-0 bg-white/10 text-white hover:bg-white/20"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* ---- Category filter chips ---- */}
      <div className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none -mx-1">
        <FilterChip
          active={filter === "all"}
          emoji="🗂️"
          label={t("ideaBoard.filterAll", "Alle")}
          onClick={() => {
            haptics.light();
            setFilter("all");
          }}
        />
        {CATEGORY_LIST.map((c) => (
          <FilterChip
            key={c.key}
            active={filter === c.key}
            emoji={c.emoji}
            icon={c.icon}
            label={t(`ideaBoard.categories.${c.key}`, c.label)}
            onClick={() => {
              haptics.light();
              setFilter(c.key);
            }}
          />
        ))}
      </div>

      {/* ---- Grid ---- */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <LayoutGrid className="h-7 w-7 text-white/40" />
          </span>
          <div>
            <p className="text-base font-semibold text-white">
              {filter === "all"
                ? t("ideaBoard.emptyTitle", "Noch keine Ideen")
                : t("ideaBoard.emptyFilterTitle", "Nichts in dieser Kategorie")}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {t("ideaBoard.emptyBody", "Pinne die erste Inspiration für dein Event!")}
            </p>
          </div>
          <Button
            onClick={() => {
              haptics.medium();
              setAddOpen(true);
            }}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t("ideaBoard.addIdea", "Idee hinzufügen")}
          </Button>
        </div>
      ) : (
        <div className="columns-2 gap-4 px-1 sm:columns-3 lg:columns-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((pin, i) => (
              <PinCard
                key={pin.id}
                pin={pin}
                index={i}
                canDelete={pin.created_by === user?.id || isOrganizer}
                onOpen={() => {
                  haptics.light();
                  setDetailPin(pin);
                }}
                onReact={() => b.toggleReaction(pin.id)}
                onDelete={() => b.deletePin(pin.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ---- Sheets ---- */}
      <AddPinSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        canAddPin={b.canAddPin}
        freePinLimit={b.freePinLimit}
        onAdd={b.addPin}
        onUpgrade={() => {
          setAddOpen(false);
          toast(t("ideaBoard.upgradeSoon", "Premium-Upgrade kommt in Kürze ✨"));
        }}
      />

      <PinDetailSheet
        pin={liveDetailPin}
        onClose={() => setDetailPin(null)}
        onReact={(id) => b.toggleReaction(id)}
        // Cast the one boundary whose element type depends on not-yet-regenerated
        // Supabase types for the new board tables (owned by the migration agent).
        loadComments={
          b.loadComments as unknown as (
            pinId: string,
          ) => Promise<{ id: string; body: string; user_id: string; created_at: string }[]>
        }
        addComment={b.addComment}
      />

      {b.board && (
        <BoardSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          board={b.board}
          onSave={b.updateBoardSettings}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FilterChip({
  active,
  emoji,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  emoji: string;
  icon?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
        active
          ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25"
          : "bg-white/8 text-white/60 hover:bg-white/15",
      )}
    >
      {icon ? (
        <img src={icon} alt="" className="h-4 w-4 shrink-0 object-contain" />
      ) : (
        <span>{emoji}</span>
      )}
      {label}
    </button>
  );
}
