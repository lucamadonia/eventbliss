/**
 * StudioPreview — full-screen overlay that renders the REAL guest form from the
 * live draft, so the organizer sees exactly what guests get.
 *
 * It renders DynamicSurveyForm in preview mode (previewMode + previewSettings).
 * Those two props — plus the per-question `data-question-key` wrappers this
 * component scrolls to — are added to DynamicSurveyForm by the parallel P1/preview
 * work; we deliberately do NOT edit that file, only consume its contract here.
 */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import DynamicSurveyForm from "@/components/survey/DynamicSurveyForm";
import DynamicHero from "@/components/survey/DynamicHero";
import type { EventSettings } from "@/lib/survey-config";
import { useHaptics } from "@/hooks/useHaptics";
import { spring } from "@/lib/motion";

// The preview contract DynamicSurveyForm exposes (previewMode/previewSettings are
// added by the parallel preview work; typed here so this file compiles against
// the agreed interface without importing an evolving prop type).
type PreviewFormProps = {
  eventId: string;
  settings: EventSettings;
  participants: never[];
  previewMode?: boolean;
  previewSettings?: EventSettings;
};
const PreviewForm = DynamicSurveyForm as unknown as React.ComponentType<PreviewFormProps>;

interface StudioPreviewProps {
  eventId: string;
  draft: EventSettings;
  /** Guest-hero context so the preview matches the REAL /e/:slug experience. */
  eventName: string;
  honoreeName?: string;
  eventType?: string;
  /** Optional core key / "custom:<id>" to scroll to and pulse on mount. */
  scrollToKey?: string;
  onEdit: () => void;
}

export function StudioPreview({ eventId, draft, eventName, honoreeName, eventType, scrollToKey, onEdit }: StudioPreviewProps) {
  const { t } = useTranslation();
  const haptics = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to the requested question and pulse a violet ring twice.
  useEffect(() => {
    if (!scrollToKey) return;
    const escaped = (window.CSS && CSS.escape ? CSS.escape(scrollToKey) : scrollToKey);
    const id = window.setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(`[data-question-key="${escaped}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.animate?.(
        [
          { boxShadow: "0 0 0 0 rgba(139,92,246,0)" },
          { boxShadow: "0 0 0 4px rgba(139,92,246,0.65)" },
          { boxShadow: "0 0 0 0 rgba(139,92,246,0)" },
        ],
        { duration: 700, iterations: 2, easing: "ease-out" },
      );
    }, 180);
    return () => window.clearTimeout(id);
  }, [scrollToKey]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      // fixed (not absolute): fill the real viewport, not the edit canvas's
      // height — otherwise a form taller than the canvas can't scroll to its
      // end. z-50 clears the app chrome (the tab bar is hidden on /dashboard).
      className="fixed inset-0 z-50 flex flex-col bg-background safe-top"
    >
      {/* Non-submitting preview banner — fixed height, never scrolls */}
      <div className="shrink-0 bg-background/80 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur">
        {t("formStudio.previewBanner", "Vorschau — Antworten werden nicht gespeichert")}
      </div>

      {/* Scroll region takes exactly the remaining space (min-h-0 so flex lets
          it shrink); generous bottom padding clears the floating edit pill and
          the native tab bar so the last field is fully reachable. */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto native-scroll pb-[calc(10rem+env(safe-area-inset-bottom))]"
      >
        {/* Cinematic hero — the template's most dramatic surface (image, palette,
            pattern, title gradient). Without it the preview looked identical for
            every template. Fed from the same draft branding the guest form uses. */}
        <DynamicHero
          eventName={eventName}
          eventType={(eventType as "bachelor" | "bachelorette" | "birthday" | "trip" | "other") || undefined}
          honoreeName={honoreeName}
          branding={draft.branding}
          keyDateLabel={draft.branding?.key_date_label}
          keyDate={draft.branding?.key_date}
          heroImageUrl={draft.branding?.hero_image_url}
          logoUrl={draft.branding?.logo_url}
          templateId={draft.branding?.template_id}
        />

        <PreviewForm
          eventId={eventId}
          settings={draft}
          participants={[]}
          previewMode
          previewSettings={draft}
        />
      </div>

      {/* Floating edit pill */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        transition={spring.snappy}
        onClick={() => {
          haptics.medium();
          onEdit();
        }}
        className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)]"
      >
        <Pencil className="h-4 w-4" />
        {t("formStudio.edit", "Bearbeiten")}
      </motion.button>
    </motion.div>
  );
}
