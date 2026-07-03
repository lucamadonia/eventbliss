import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import type { CoreQuestionProps } from "./types";

const DateBlocksQuestion = ({ control, questionConfig, dateBlocks }: CoreQuestionProps) => {
  return (
    <>
      {/* Date Blocks - Dynamic from event settings */}
      {questionConfig?.date_blocks?.enabled !== false && dateBlocks.length > 0 && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
          <FormField
            control={control}
            name="date_blocks"
            render={() => (
              <FormItem>
                <FormLabel className="form-label">Mögliche Termine *</FormLabel>
                <FormDescription className="text-xs flex items-start gap-1.5 mb-3">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Wähle ALLE Termine, die für dich gehen – nicht nur den Favoriten!</span>
                </FormDescription>
                <div className="grid gap-3">
                  {dateBlocks.map((block) => (
                    <FormField
                      key={block.key}
                      control={control}
                      name="date_blocks"
                      render={({ field }) => (
                        <FormItem
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            block.warning
                              ? "border-warning/50 bg-warning/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(block.key)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(field.value || []), block.key]
                                  : field.value?.filter((v) => v !== block.key) || [];
                                field.onChange(newValue);
                              }}
                            />
                          </FormControl>
                          <div className="flex-1">
                            <Label className="cursor-pointer font-medium">
                              Block {block.key}: {block.label}
                            </Label>
                            {block.warning && (
                              <p className="text-xs text-warning mt-1">
                                ⚠️ {block.warning}
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Partial Days (Optional) */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 mb-4">
        <FormField
          control={control}
          name="partial_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="form-label">Teilweise möglich? (optional)</FormLabel>
              <FormDescription className="text-xs mb-2">
                Falls du nur an bestimmten Tagen/Uhrzeiten kannst
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="z.B. Block B nur Samstag, ab 14 Uhr..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default DateBlocksQuestion;
