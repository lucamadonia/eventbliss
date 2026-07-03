import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomQuestionFieldProps } from "./types";

const CustomQuestionField = ({ question, value, onChange }: CustomQuestionFieldProps) => {
  return (
    <div className="space-y-2">
      <Label className="form-label">
        {question.label} {question.required && "*"}
      </Label>

      {question.type === "toggle" && (
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className="text-sm text-muted-foreground">
            {value ? "Ja" : "Nein"}
          </span>
        </div>
      )}

      {question.type === "textarea" && (
        <Textarea
          placeholder={question.placeholder || "Deine Antwort..."}
          className="resize-none"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === "text" && (
        <Input
          placeholder={question.placeholder || "Deine Antwort..."}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === "select" && question.options && (
        <Select
          value={(value as string) || ""}
          onValueChange={(value) => onChange(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Bitte auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === "radio" && question.options && (
        <RadioGroup
          value={(value as string) || ""}
          onValueChange={(value) => onChange(value)}
          className="grid gap-2"
        >
          {question.options.map((opt) => (
            <div
              key={opt}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
              <Label htmlFor={`${question.id}-${opt}`} className="cursor-pointer flex-1">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === "checkbox" && question.options && (
        <div className="grid gap-2">
          {question.options.map((opt) => {
            const currentValues = (value as string || "").split(",").filter(Boolean);
            const isChecked = currentValues.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isChecked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...currentValues, opt]
                      : currentValues.filter((v) => v !== opt);
                    onChange(newValues.join(","));
                  }}
                />
                <span className="cursor-pointer flex-1">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* TODO i18n guest form — German placeholders kept consistent with the strings above */}
      {question.type === "rating" && (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const current = Number((value as string) || "0");
            const active = n <= current;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(String(n))}
                aria-label={`${n} von 5`}
                className={`text-2xl leading-none transition-colors ${
                  active ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
      )}

      {question.type === "number" && (
        <Input
          type="number"
          inputMode="decimal"
          placeholder={question.placeholder || "Zahl eingeben..."}
          min={question.min}
          max={question.max}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === "date" && (
        <Input
          type="date"
          className="[color-scheme:dark]"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default CustomQuestionField;
