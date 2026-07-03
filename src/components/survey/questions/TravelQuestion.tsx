import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CoreQuestionProps } from "./types";

const TravelQuestion = ({ control, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  if (questionConfig?.travel?.enabled === false) return null;

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
      <FormField
        control={control}
        name="travel_pref"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">Reisebereitschaft *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid gap-3"
              >
                {config.travel_options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} id={`travel-${option.value}`} />
                    <Label htmlFor={`travel-${option.value}`} className="cursor-pointer flex-1">
                      {translateLabel(option.label)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default TravelQuestion;
