import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SurveyOptionCard from "../SurveyOptionCard";
import type { CustomQuestionFieldProps } from "./types";

const CustomQuestionField = ({ question, value, onChange }: CustomQuestionFieldProps) => {
  const { t } = useTranslation();
  const answerPlaceholder = t("guestForm.answerPlaceholder", { defaultValue: "Deine Antwort..." });

  return (
    <div className="space-y-2">
      <Label className="form-label">
        {question.label} {question.required && "*"}
      </Label>

      {question.type === "toggle" && (
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/[0.08]">
          <Switch
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className="text-sm text-muted-foreground">
            {value
              ? t("guestForm.yes", { defaultValue: "Ja" })
              : t("guestForm.no", { defaultValue: "Nein" })}
          </span>
        </div>
      )}

      {question.type === "textarea" && (
        <Textarea
          placeholder={question.placeholder || answerPlaceholder}
          className="resize-none"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {question.type === "text" && (
        <Input
          placeholder={question.placeholder || answerPlaceholder}
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
            <SelectValue placeholder={t("guestForm.selectPlaceholder", { defaultValue: "Bitte auswählen..." })} />
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
        <div className="grid gap-2">
          {question.options.map((opt) => (
            <SurveyOptionCard
              key={opt}
              label={opt}
              selected={(value as string) === opt}
              onSelect={() => onChange(opt)}
            />
          ))}
        </div>
      )}

      {question.type === "checkbox" && question.options && (
        <div className="grid gap-2">
          {question.options.map((opt) => {
            const currentValues = ((value as string) || "").split(",").filter(Boolean);
            const isChecked = currentValues.includes(opt);
            return (
              <SurveyOptionCard
                key={opt}
                multiSelect
                label={opt}
                selected={isChecked}
                onSelect={() =>
                  onChange(
                    (isChecked
                      ? currentValues.filter((v) => v !== opt)
                      : [...currentValues, opt]
                    ).join(",")
                  )
                }
              />
            );
          })}
        </div>
      )}

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
                aria-label={t("guestForm.ratingStar", { defaultValue: "{{n}} von 5", n })}
                className={`text-2xl leading-none transition-colors ${
                  active ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                }`}
                style={active ? { color: "var(--template-primary, hsl(var(--primary)))" } : undefined}
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
          placeholder={question.placeholder || t("guestForm.numberPlaceholder", { defaultValue: "Zahl eingeben..." })}
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
