import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import SurveyQuestionWrapper from "../SurveyQuestionWrapper";
import SurveyOptionCard from "../SurveyOptionCard";
import type { CoreQuestionProps } from "./types";

const DateBlocksQuestion = ({ control, questionConfig, dateBlocks }: CoreQuestionProps) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Date Blocks - Dynamic from event settings */}
      {questionConfig?.date_blocks?.enabled !== false && dateBlocks.length > 0 && (
        <SurveyQuestionWrapper>
          <FormField
            control={control}
            name="date_blocks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="form-label">
                  {t("guestForm.q.dateBlocks", { defaultValue: "Mögliche Termine" })} *
                </FormLabel>
                <FormDescription className="text-xs flex items-start gap-1.5 mb-3">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    {t("guestForm.q.dateBlocksHint", {
                      defaultValue:
                        "Wähle ALLE Termine, die für dich gehen – nicht nur den Favoriten!",
                    })}
                  </span>
                </FormDescription>
                <div className="grid gap-3">
                  {dateBlocks.map((block) => {
                    const selected = field.value?.includes(block.key);
                    return (
                      <SurveyOptionCard
                        key={block.key}
                        multiSelect
                        label={t("guestForm.q.blockLabel", {
                          defaultValue: "Block {{key}}: {{label}}",
                          key: block.key,
                          label: block.label,
                        })}
                        description={block.warning ? `⚠️ ${block.warning}` : undefined}
                        selected={!!selected}
                        onSelect={() => {
                          const current = field.value || [];
                          field.onChange(
                            current.includes(block.key)
                              ? current.filter((v) => v !== block.key)
                              : [...current, block.key]
                          );
                        }}
                      />
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </SurveyQuestionWrapper>
      )}

      {/* Partial Days (Optional) */}
      <SurveyQuestionWrapper>
        <FormField
          control={control}
          name="partial_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label">
                {t("guestForm.q.partialDays", { defaultValue: "Teilweise möglich? (optional)" })}
              </FormLabel>
              <FormDescription className="text-xs mb-2">
                {t("guestForm.q.partialDaysHint", {
                  defaultValue: "Falls du nur an bestimmten Tagen/Uhrzeiten kannst",
                })}
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={t("guestForm.q.partialDaysPlaceholder", {
                    defaultValue: "z.B. Block B nur Samstag, ab 14 Uhr...",
                  })}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SurveyQuestionWrapper>
    </>
  );
};

export default DateBlocksQuestion;
