import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
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

const DestinationQuestion = ({ control, watch, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  const { t } = useTranslation();
  if (questionConfig?.destination?.enabled === false) return null;
  const multi = !!questionConfig?.destination?.multiSelect;

  const watchDestination = watch("destination");
  const showDeCityField = Array.isArray(watchDestination)
    ? watchDestination.includes("de_city")
    : watchDestination === "de_city";

  return (
    <SurveyQuestionWrapper>
      <FormField
        control={control}
        name="destination"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">
              {t("guestForm.q.destination", { defaultValue: "Reiseziel" })} *
            </FormLabel>
            <FormControl>
              <div className="grid gap-3">
                {config.destination_options.map((option) => {
                  const values = Array.isArray(field.value) ? field.value : [];
                  const selected = multi
                    ? values.includes(option.value)
                    : field.value === option.value;
                  return (
                    <SurveyOptionCard
                      key={option.value}
                      label={translateLabel(option.label)}
                      icon={option.emoji}
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

      {/* DE City (conditional) */}
      {showDeCityField && (
        <FormField
          control={control}
          name="de_city"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel className="form-label">
                {t("guestForm.q.deCity", { defaultValue: "Wunschstadt in DE (optional)" })}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("guestForm.q.deCityPlaceholder", {
                    defaultValue: "z.B. Berlin, Hamburg, München, Köln...",
                  })}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </SurveyQuestionWrapper>
  );
};

export default DestinationQuestion;
