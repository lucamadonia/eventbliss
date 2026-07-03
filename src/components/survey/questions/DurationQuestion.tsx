import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { CoreQuestionProps } from "./types";

const DurationQuestion = ({ control, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  if (questionConfig?.duration?.enabled === false) return null;

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
      <FormField
        control={control}
        name="duration_pref"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">Bevorzugte Dauer *</FormLabel>
            <FormControl>
              {questionConfig?.duration?.multiSelect ? (
                <div className="grid gap-3">
                  {config.duration_options.map((option) => {
                    const values = Array.isArray(field.value) ? field.value : [];
                    const isChecked = values.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isChecked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...values, option.value]
                              : values.filter((v) => v !== option.value);
                            field.onChange(newValue);
                          }}
                        />
                        <span className="cursor-pointer flex-1">{translateLabel(option.label)}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={typeof field.value === 'string' ? field.value : ''}
                  className="grid gap-3"
                >
                  {config.duration_options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => field.onChange(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={`duration-${option.value}`} />
                      <Label htmlFor={`duration-${option.value}`} className="cursor-pointer flex-1">
                        {translateLabel(option.label)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default DurationQuestion;
