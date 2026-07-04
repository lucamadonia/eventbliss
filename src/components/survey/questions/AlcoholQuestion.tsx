import { useTranslation } from "react-i18next";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SurveyQuestionWrapper from "../SurveyQuestionWrapper";
import SurveyOptionCard from "../SurveyOptionCard";
import type { CoreQuestionProps } from "./types";

const AlcoholQuestion = ({ control, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  const { t } = useTranslation();
  if (questionConfig?.alcohol?.enabled === false) return null;

  return (
    <SurveyQuestionWrapper>
      <FormField
        control={control}
        name="alcohol"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">
              {t("guestForm.q.alcohol", { defaultValue: "Alkohol? (optional)" })}
            </FormLabel>
            <FormControl>
              <div className="grid gap-3 sm:grid-cols-3">
                {config.alcohol_options.map((option) => (
                  <SurveyOptionCard
                    key={option.value}
                    label={translateLabel(option.label)}
                    icon={option.emoji}
                    selected={field.value === option.value}
                    onSelect={() => field.onChange(option.value)}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SurveyQuestionWrapper>
  );
};

export default AlcoholQuestion;
