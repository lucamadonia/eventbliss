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
import { tOption } from "@/lib/survey-config";
import type { CoreQuestionProps } from "./types";

const AttendanceQuestion = ({ control, config, translateLabel }: CoreQuestionProps) => {
  const { t } = useTranslation();
  return (
    <SurveyQuestionWrapper>
      <FormField
        control={control}
        name="attendance"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">
              {t("guestForm.q.attendance", { defaultValue: "Bist du dabei?" })} *
            </FormLabel>
            <FormControl>
              <div className="grid gap-3">
                {config.attendance_options.map((option) => (
                  <SurveyOptionCard
                    key={option.value}
                    label={tOption(t as unknown as Parameters<typeof tOption>[0], "attendance", option.value, option.label)}
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

export default AttendanceQuestion;
