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

const AttendanceQuestion = ({ control, config, translateLabel }: CoreQuestionProps) => {
  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
      <FormField
        control={control}
        name="attendance"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">Bist du dabei? *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid gap-3"
              >
                {config.attendance_options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} id={`attendance-${option.value}`} />
                    <Label htmlFor={`attendance-${option.value}`} className="cursor-pointer flex-1">
                      {translateLabel(option.label)} {option.emoji}
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

export default AttendanceQuestion;
