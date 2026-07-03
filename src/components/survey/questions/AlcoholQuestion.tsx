import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CoreQuestionProps } from "./types";

const AlcoholQuestion = ({ control, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  if (questionConfig?.alcohol?.enabled === false) return null;

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
      <FormField
        control={control}
        name="alcohol"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">Alkohol? (optional)</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-3 gap-3"
              >
                {config.alcohol_options.map((option) => {
                  const isSelected = field.value === option.value;
                  return (
                    <div
                      key={option.value}
                      onClick={() => field.onChange(option.value)}
                      className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={`alcohol-${option.value}`} className="sr-only" />
                      <span className="text-center text-sm">
                        {translateLabel(option.label)} {option.emoji}
                      </span>
                    </div>
                  );
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AlcoholQuestion;
