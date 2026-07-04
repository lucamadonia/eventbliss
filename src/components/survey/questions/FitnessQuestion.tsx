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

const FitnessQuestion = ({ control, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  const { t } = useTranslation();
  if (questionConfig?.fitness?.enabled === false) return null;

  return (
    <SurveyQuestionWrapper>
      <FormField
        control={control}
        name="fitness_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">
              {t("guestForm.q.fitness", { defaultValue: "Fitness-Level" })} *
            </FormLabel>
            <FormControl>
              <div className="grid gap-3 sm:grid-cols-3">
                {config.fitness_options.map((option) => (
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

export default FitnessQuestion;
