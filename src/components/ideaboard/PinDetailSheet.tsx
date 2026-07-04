/**
 * PinDetailSheet — full-size view of a pin with its comment thread.
 * Loads comments on open (loadComments) and lets the user post new ones.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Heart, Send, Loader2, ExternalLink, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BoardPin } from "@/hooks/useIdeaBoard";
import { CATEGORY_META } from "./categories";

interface PinComment {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
}

interface PinDetailSheetProps {
  pin: BoardPin | null;
  onClose: () => void;
  onReact: (pinId: string) => void;
  loadComments: (pinId: string) => Promise<PinComment[]>;
  addComment: (pinId: string, body: string) => Promise<void>;
}

function initials(userId: string): string {
  return userId.slice(0, 2).toUpperCase();
}

export function PinDetailSheet({
  pin,
  onClose,
  onReact,
  loadComments,
  addComment,
}: PinDetailSheetProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const keyboardInset = useKeyboardInset();
  const [comments, setComments] = useState<PinComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const pinId = pin?.id ?? null;

  useEffect(() => {
    if (!pinId) return;
    let active = true;
    setLoading(true);
    setComments([]);
    loadComments(pinId)
      .then((rows) => {
        if (active) setComments(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pinId, loadComments]);

  const submit = async () => {
    if (!pinId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await addComment(pinId, draft.trim());
      haptics.light();
      setDraft("");
      const rows = await loadComments(pinId);
      setComments(rows);
    } finally {
      setSending(false);
    }
  };

  const cat = pin ? CATEGORY_META[pin.category] ?? CATEGORY_META.other : null;

  return (
    <Sheet open={!!pin} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-white/10 bg-[#0d0a1a]/95 backdrop-blur-2xl"
      >
        {pin && cat && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 text-white">
                <img src={cat.icon} alt="" className="h-6 w-6 object-contain" />
                {pin.title || t(`ideaBoard.categories.${pin.category}`, cat.label)}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-3 flex flex-col gap-4 pb-6">
              {/* Media */}
              {pin.kind === "image" && pin.imageUrl && (
                <img
                  src={pin.imageUrl}
                  alt={pin.title ?? ""}
                  className="max-h-[45vh] w-full rounded-2xl object-contain"
                />
              )}
              {pin.kind === "note" && pin.note && (
                <p className="whitespace-pre-line rounded-2xl bg-white/5 px-4 py-4 text-sm leading-relaxed text-white/85">
                  {pin.note}
                </p>
              )}
              {pin.kind === "link" && pin.url && (
                <a
                  href={pin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-white"
                >
                  <Link2 className="h-5 w-5 shrink-0 text-white/60" />
                  <span className="min-w-0 flex-1 truncate text-sm">{pin.url}</span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-white/40" />
                </a>
              )}
              {pin.kind === "embed" && (pin.embed_html || pin.url) && (
                <iframe
                  title={pin.title ?? "embed"}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  {...(pin.embed_html ? { srcDoc: pin.embed_html } : { src: pin.url! })}
                  className="h-80 w-full rounded-2xl border-0 bg-white"
                  loading="lazy"
                />
              )}

              {/* Reaction row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    onReact(pin.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                    pin.myReaction
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-white/5 text-white/70 hover:bg-white/10",
                  )}
                >
                  <Heart className={cn("h-4 w-4", pin.myReaction && "fill-current")} />
                  {pin.reactionCount > 0 && (
                    <span className="tabular-nums">{pin.reactionCount}</span>
                  )}
                </button>
              </div>

              {/* Comments */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  {t("ideaBoard.comments", "Kommentare")}
                  {comments.length > 0 && ` · ${comments.length}`}
                </h3>

                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-white/40">
                    {t("ideaBoard.noComments", "Noch keine Kommentare. Sag was Nettes!")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                          {initials(c.user_id)}
                        </span>
                        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-white/5 px-3 py-2">
                          <p className="text-sm text-white/85">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comment composer — lifted above the on-screen keyboard */}
            <div
              className="sticky bottom-0 -mx-6 flex items-center gap-2 border-t border-white/10 bg-[#0d0a1a]/95 px-6 py-3 backdrop-blur-xl"
              style={keyboardInset ? { bottom: keyboardInset } : undefined}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={t("ideaBoard.commentPlaceholder", "Kommentar schreiben…")}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
              <Button
                size="icon"
                onClick={submit}
                disabled={!draft.trim() || sending}
                className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:opacity-90"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
