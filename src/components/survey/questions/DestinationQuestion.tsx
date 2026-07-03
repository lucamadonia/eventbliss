import { Input } from "@/components/ui/input";
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

const DestinationQuestion = ({ control, watch, config, questionConfig, translateLabel }: CoreQuestionProps) => {
  if (questionConfig?.destination?.enabled === false) return null;

  const watchDestination = watch("destination");
  const showDeCityField = Array.isArray(watchDestination)
    ? watchDestination.includes("de_city")
    : watchDestination === "de_city";

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
      <FormField
        control={control}
        name="destination"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="form-label">Destination *</FormLabel>
            <FormControl>
              {questionConfig.destination.multiSelect ? (
                <div className="grid gap-3">
                  {config.destination_options.map((option) => {
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
                        <span className="cursor-pointer flex-1">
                          {translateLabel(option.label)} {option.emoji}
                        </span>
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
                  {config.destination_options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value={option.value} id={`dest-${option.value}`} />
                      <Label htmlFor={`dest-${option.value}`} className="cursor-pointer flex-1">
                        {translateLabel(option.label)} {option.emoji}
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

      {/* DE City (conditional) */}
      {showDeCityField && (
        <FormField
          control={control}
          name="de_city"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel className="form-label">Wunschstadt in DE (optional)</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Berlin, Hamburg, München, Köln..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default DestinationQuestion;
