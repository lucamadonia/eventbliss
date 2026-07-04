/**
 * PinCard — a single moodboard pin. Renders by kind (image / link / note /
 * embed), shows a category chip, a ❤️ reaction button and a comment count.
 * The pin's author can delete it (trash → confirm).
 */
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useHaptics } from "@/hooks/useHaptics";
import type { BoardPin } from "@/hooks/useIdeaBoard";
import { CATEGORY_META } from "./categories";
import { LinkPreviewCard } from "./LinkPreviewCard";

interface PinCardProps {
  pin: BoardPin;
  canDelete: boolean;
  index: number;
  onOpen: () => void;
  onReact: () => void;
  onDelete: () => Promise<void>;
}

export function PinCard({ pin, canDelete, index, onOpen, onReact, onDelete }: PinCardProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const reduce = useReducedMotion();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cat = CATEGORY_META[pin.category] ?? CATEGORY_META.other;
  const catLabel = t(`ideaBoard.categories.${pin.category}`, cat.label);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
      haptics.success();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleReact = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    onReact();
  };

  return (
    <motion.div
      layout
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...spring.soft, delay: Math.min(index * 0.04, 0.4) }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      onClick={onOpen}
      className={cn(
        "group relative mb-4 block w-full break-inside-avoid cursor-pointer overflow-hidden",
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-lg shadow-black/20 transition-shadow hover:shadow-xl hover:shadow-violet-500/10",
      )}
    >
      {/* ---- Media / body by kind ---- */}
      {pin.kind === "image" && pin.imageUrl && (
        <div className="relative w-full overflow-hidden">
          <img
            src={pin.imageUrl}
            alt={pin.title ?? catLabel}
            loading="lazy"
            className="w-full object-cover"
          />
        </div>
      )}

      {pin.kind === "note" && (
        <div className="bg-gradient-to-br from-violet-600/25 via-fuchsia-500/15 to-cyan-500/15 px-4 py-5">
          {pin.title && (
            <p className="mb-1 text-sm font-bold leading-tight text-white">{pin.title}</p>
          )}
          {pin.note && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/80">{pin.note}</p>
          )}
        </div>
      )}

      {pin.kind === "link" && pin.url && (
        <LinkPreviewCard url={pin.url} title={pin.title} onClick={(e) => e.stopPropagation()} />
      )}

      {pin.kind === "embed" && pin.url && (
        <LinkPreviewCard url={pin.url} title={pin.title} onClick={(e) => e.stopPropagation()} />
      )}

      {/* ---- Footer: category chip + reactions/comments ---- */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/70">
          <img src={cat.icon} alt="" className="h-4 w-4 object-contain" />
          <span className="truncate">{catLabel}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReact}
            aria-label={t("ideaBoard.react", "Gefällt mir")}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors",
              pin.myReaction
                ? "bg-rose-500/20 text-rose-300"
                : "text-white/60 hover:bg-white/10",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", pin.myReaction && "fill-current")} />
            {pin.reactionCount > 0 && <span className="tabular-nums">{pin.reactionCount}</span>}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            aria-label={t("ideaBoard.comments", "Kommentare")}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {pin.commentCount > 0 && <span className="tabular-nums">{pin.commentCount}</span>}
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label={t("ideaBoard.delete", "Löschen")}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-2 py-1 text-xs transition-colors",
                confirming
                  ? "bg-red-500/25 text-red-300"
                  : "text-white/50 hover:bg-white/10 hover:text-red-300",
              )}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {confirming && !deleting && (
                <span className="ml-1">{t("ideaBoard.confirmDelete", "Sicher?")}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
