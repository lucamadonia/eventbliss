/**
 * QuestionLivePreview — renders ONE real guest question inside a glass "Live"
 * frame so the organizer sees exactly what a guest will see while they edit.
 *
 * Core questions reuse the actual CORE_QUESTION_RENDERERS driven by a throwaway
 * local react-hook-form (no resolver) so radios/checkboxes are interactive
 * ghost state. Custom questions render the existing CustomQuestionPreview.
 */
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { motion } from "framer-motion";
import { Form } from "@/components/ui/form";
import { CORE_QUESTION_RENDERERS, type CoreQuestionKey } from "@/components/survey/questions";
import { CustomQuestionPreview } from "@/components/dashboard/CustomQuestionPreview";
import {
  type EventSettings,
  type CustomQuestion,
  type QuestionConfigs,
  getDateBlocksArray,
} from "@/lib/survey-config";
import type { DynamicResponseFormData } from "@/lib/schemas";

interface LivePreviewProps {
  settings: EventSettings;
  /** A core question key, or a CustomQuestion to preview. Exactly one applies. */
  coreKey?: CoreQuestionKey;
  custom?: CustomQuestion;
}

function Frame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.06] p-1.5"
    >
      <span className="absolute -top-2 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
        {t("formStudio.preview", "Live")}
      </span>
      <div className="pointer-events-auto">{children}</div>
    </motion.div>
  );
}

export function QuestionLivePreview({ settings, coreKey, custom }: LivePreviewProps) {
  const { t } = useTranslation();
  const form = useForm<DynamicResponseFormData>({ defaultValues: {} as DynamicResponseFormData });

  if (custom) {
    return (
      <Frame>
        <CustomQuestionPreview questions={[custom]} />
      </Frame>
    );
  }

  if (!coreKey) return null;

  const Renderer = CORE_QUESTION_RENDERERS[coreKey];
  if (!Renderer) return null;

  // Force this question visible even if its enabled flag is off in the draft —
  // you're actively editing it, so it must show.
  const baseConfig = settings.question_config as QuestionConfigs;
  const questionConfig: QuestionConfigs = {
    ...baseConfig,
    [coreKey]: { ...baseConfig[coreKey], enabled: true },
  };

  const translateLabel = (label: string): string =>
    label.startsWith("templates.") && i18n.exists(label) ? t(label) : label;

  return (
    <Frame>
      <Form {...form}>
        <Renderer
          control={form.control}
          watch={form.watch}
          config={settings}
          questionConfig={questionConfig}
          translateLabel={translateLabel}
          dateBlocks={getDateBlocksArray(settings.date_blocks, settings.date_warnings)}
        />
      </Form>
    </Frame>
  );
}
