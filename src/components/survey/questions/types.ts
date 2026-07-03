import type { Control, UseFormWatch } from "react-hook-form";
import type { DynamicResponseFormData } from "@/lib/schemas";
import type {
  EventSettings,
  QuestionConfigs,
  DateBlockOption,
  CustomQuestion,
} from "@/lib/survey-config";

/** The nine core (built-in) question keys, matching CORE_QUESTION_KEYS. */
export type CoreQuestionKey =
  | "attendance"
  | "duration"
  | "date_blocks"
  | "budget"
  | "destination"
  | "travel"
  | "activities"
  | "fitness"
  | "alcohol";

/**
 * Uniform props for every core question renderer. Each block only consumes the
 * subset it needs, but the signature is shared so they can be stored in a
 * registry and rendered interchangeably.
 */
export interface CoreQuestionProps {
  control: Control<DynamicResponseFormData>;
  watch: UseFormWatch<DynamicResponseFormData>;
  config: EventSettings;
  questionConfig: QuestionConfigs | undefined;
  translateLabel: (label: string) => string;
  dateBlocks: DateBlockOption[];
}

/** Props for a single custom question (answers live outside react-hook-form). */
export interface CustomQuestionFieldProps {
  question: CustomQuestion;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}
