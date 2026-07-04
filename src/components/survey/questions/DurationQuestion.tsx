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

const DurationQuestion = ({ control, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  const { t } = useTranslation();
  if (questionConfig?.duration?.enabled === false) return null;
  const multi = !!questionConfig?.duration?.multiSelect;

  return (
    <SurveyQuestionWrapper>
      <FormField
        control={control}
        name="duration_pref"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">
              {t("guestForm.q.duration", { defaultValue: "Bevorzugte Dauer" })} *
            </FormLabel>
            <FormControl>
              <div className="grid gap-3">
                {config.duration_options.map((option) => {
                  const values = Array.isArray(field.value) ? field.value : [];
                  const selected = multi
                    ? values.includes(option.value)
                    : field.value === option.value;
                  return (
                    <SurveyOptionCard
                      key={option.value}
                      label={translateLabel(option.label)}
                      multiSelect={multi}
                      selected={selected}
                      onSelect={() => {
                        if (multi) {
                          field.onChange(
                            values.includes(option.value)
                              ? values.filter((v) => v !== option.value)
                              : [...values, option.value]
                          );
                        } else {
                          field.onChange(option.value);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SurveyQuestionWrapper>
  );
};

export default DurationQuestion;
