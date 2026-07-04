/**
 * AiIdeasSheet — bottom sheet that generates AI idea suggestions for the board.
 * The user picks a category (or "surprise me") and generates 6 ideas via the
 * "ideaboard-suggest" edge function. Each idea can be pinned to the board.
 * Free users hitting the credit wall (HTTP 402 / code "no_credits") see the same
 * premium upgrade prompt used in AddPinSheet.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Crown, Loader2, Check, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { AddPinInput, PinCategory } from "@/hooks/useIdeaBoard";
import { CATEGORY_LIST, CATEGORY_META } from "./categories";

export interface AiIdea {
  title: string;
  note: string;
  category: string;
}

interface AiIdeasSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    name: string;
    event_type?: string;
    honoree_name?: string;
  };
  freePinLimit: number;
  /** Pins a single idea to the board (source "ai"). Resolves on success. */
  onPin: (input: AddPinInput) => Promise<void>;
  onUpgrade?: () => void;
}

type CatChoice = "any" | PinCategory;

/** Coerce an arbitrary category string from the model into a known PinCategory. */
function normalizeCategory(raw: string): PinCategory {
  const key = (raw || "").toLowerCase().trim();
  return (CATEGORY_META as Record<string, unknown>)[key] ? (key as PinCategory) : "other";
}

export function AiIdeasSheet({
  open,
  onOpenChange,
  event,
  freePinLimit,
  onPin,
  onUpgrade,
}: AiIdeasSheetProps) {
  const { t, i18n } = useTranslation();
  const haptics = useHaptics();

  const [category, setCategory] = useState<CatChoice>("any");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<AiIdea[] | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [pinning, setPinning] = useState<number | null>(null);
  const [pinned, setPinned] = useState<Record<number, boolean>>({});

  const close = () => {
    onOpenChange(false);
  };

  const generate = async () => {
    setLoading(true);
    setNeedsUpgrade(false);
    haptics.medium();
    try {
      const { data, error } = await supabase.functions.invoke("ideaboard-suggest", {
        body: {
          event_type: event.event_type,
          theme: undefined,
          category: category === "any" ? undefined : category,
          honoree_name: event.honoree_name,
          guest_count: undefined,
          language: i18n.language.split("-")[0],
          count: 6,
        },
      });

      // A 402 (free user out of credits) arrives as a FunctionsHttpError; the
      // JSON body still carries { success:false, code:"no_credits" }.
      const payload =
        (data as { success?: boolean; ideas?: AiIdea[]; code?: string; error?: string } | null) ??
        null;

      if (error || !payload || payload.success === false) {
        let code = payload?.code;
        // Try to recover the body from the thrown HTTP error (Supabase wraps it).
        if (!code && error && "context" in (error as object)) {
          try {
            const ctx = (error as { context?: { json?: () => Promise<{ code?: string }> } }).context;
            const body = await ctx?.json?.();
            code = body?.code;
          } catch {
            /* ignore */
          }
        }
        if (code === "no_credits") {
          setNeedsUpgrade(true);
          setIdeas(null);
          return;
        }
        throw new Error(payload?.error || "generate-failed");
      }

      const list = Array.isArray(payload.ideas) ? payload.ideas : [];
      setIdeas(list);
      setPinned({});
      haptics.success();
      if (list.length === 0) {
        toast(t("ideaBoard.aiEmpty", "Keine Ideen gefunden. Versuch's nochmal."));
      }
    } catch {
      toast.error(t("ideaBoard.aiError", "Ideen konnten nicht generiert werden"));
    } finally {
      setLoading(false);
    }
  };

  const pin = async (idea: AiIdea, index: number) => {
    if (pinned[index] || pinning !== null) return;
    setPinning(index);
    try {
      await onPin({
        kind: "note",
        category: normalizeCategory(idea.category),
        title: idea.title,
        note: idea.note,
        source: "ai",
      });
      haptics.success();
      setPinned((p) => ({ ...p, [index]: true }));
      toast.success(t("ideaBoard.aiPinned", "Zur Ideenwand hinzugefügt"));
    } catch (err) {
      if ((err as Error).message === "free-limit") {
        toast.error(t("ideaBoard.upgradeTitle", "Premium für unbegrenzte Ideen"));
      } else {
        toast.error(t("ideaBoard.addError", "Konnte nicht gespeichert werden"));
      }
    } finally {
      setPinning(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-white/10 bg-[#0d0a1a]/95 backdrop-blur-2xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            {t("ideaBoard.aiTitle", "KI-Ideen")}
          </SheetTitle>
          <SheetDescription>
            {t("ideaBoard.aiSubtitle", "Lass dir passende Ideen für dein Event vorschlagen.")}
          </SheetDescription>
        </SheetHeader>

        {needsUpgrade ? (
          /* ---- Upgrade prompt (shared copy with AddPinSheet) ---- */
          <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 via-fuchsia-500/10 to-violet-500/15 px-5 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/20">
              <Crown className="h-7 w-7 text-amber-300" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {t("ideaBoard.upgradeTitle", "Premium für unbegrenzte Ideen")}
              </h3>
              <p className="mt-1 text-sm text-white/60">
                {t(
                  "ideaBoard.upgradeBody",
                  "Kostenlos sind {{count}} Ideen möglich. Mit Premium wird dein Board grenzenlos.",
                  { count: freePinLimit },
                )}
              </p>
            </div>
            <Button
              onClick={() => {
                haptics.medium();
                onUpgrade?.();
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-fuchsia-500 text-white hover:opacity-90"
            >
              <Crown className="h-4 w-4" />
              {t("ideaBoard.upgradeCta", "Premium freischalten")}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-5 pb-8">
            {/* Category picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                {t("ideaBoard.aiCategoryLabel", "Wofür?")}
              </label>
              <div className="flex flex-wrap gap-2">
                <ChoiceChip
                  active={category === "any"}
                  emoji="✨"
                  label={t("ideaBoard.aiAnyCategory", "Überrasch mich")}
                  onClick={() => {
                    haptics.select();
                    setCategory("any");
                  }}
                />
                {CATEGORY_LIST.map((c) => (
                  <ChoiceChip
                    key={c.key}
                    active={category === c.key}
                    icon={c.icon}
                    emoji={c.emoji}
                    label={t(`ideaBoard.categories.${c.key}`, c.label)}
                    onClick={() => {
                      haptics.select();
                      setCategory(c.key);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={generate}
              disabled={loading}
              className="h-12 w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-base font-bold text-white hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : ideas ? (
                <>
                  <RefreshCw className="h-5 w-5" />
                  {t("ideaBoard.aiRegenerate", "Neu generieren")}
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  {t("ideaBoard.aiGenerate", "Ideen generieren")}
                </>
              )}
            </Button>

            {/* Loading skeleton */}
            {loading && !ideas && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" />
                <p className="text-sm text-white/50">
                  {t("ideaBoard.aiGenerating", "Ideen werden gezaubert…")}
                </p>
              </div>
            )}

            {/* Results */}
            {ideas && ideas.length > 0 && (
              <div className="flex flex-col gap-3">
                {ideas.map((idea, i) => {
                  const cat = CATEGORY_META[normalizeCategory(idea.category)];
                  const isPinned = !!pinned[i];
                  return (
                    <div
                      key={i}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8">
                        <img src={cat.icon} alt="" className="h-6 w-6 object-contain" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-tight text-white">{idea.title}</p>
                        {idea.note && (
                          <p className="mt-1 text-sm leading-relaxed text-white/70">{idea.note}</p>
                        )}
                        <Button
                          size="sm"
                          onClick={() => pin(idea, i)}
                          disabled={isPinned || pinning !== null}
                          className={cn(
                            "mt-2.5 h-8 font-semibold",
                            isPinned
                              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                              : "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:opacity-90",
                          )}
                        >
                          {pinning === i ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPinned ? (
                            <>
                              <Check className="h-4 w-4" />
                              {t("ideaBoard.aiPinnedShort", "Angepinnt")}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              {t("ideaBoard.aiPin", "Anpinnen")}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

function ChoiceChip({
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
