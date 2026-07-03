import type { FC } from "react";

import AttendanceQuestion from "./AttendanceQuestion";
import DurationQuestion from "./DurationQuestion";
import DateBlocksQuestion from "./DateBlocksQuestion";
import BudgetQuestion from "./BudgetQuestion";
import DestinationQuestion from "./DestinationQuestion";
import TravelQuestion from "./TravelQuestion";
import ActivitiesQuestion from "./ActivitiesQuestion";
import FitnessQuestion from "./FitnessQuestion";
import AlcoholQuestion from "./AlcoholQuestion";
import CustomQuestionField from "./CustomQuestionField";

import type { CoreQuestionKey, CoreQuestionProps } from "./types";

/** Registry mapping each core question key to its renderer. */
export const CORE_QUESTION_RENDERERS: Record<CoreQuestionKey, FC<CoreQuestionProps>> = {
  attendance: AttendanceQuestion,
  duration: DurationQuestion,
  date_blocks: DateBlocksQuestion,
  budget: BudgetQuestion,
  destination: DestinationQuestion,
  travel: TravelQuestion,
  activities: ActivitiesQuestion,
  fitness: FitnessQuestion,
  alcohol: AlcoholQuestion,
};

export {
  AttendanceQuestion,
  DurationQuestion,
  DateBlocksQuestion,
  BudgetQuestion,
  DestinationQuestion,
  TravelQuestion,
  ActivitiesQuestion,
  FitnessQuestion,
  AlcoholQuestion,
  CustomQuestionField,
};

export type { CoreQuestionKey, CoreQuestionProps, CustomQuestionFieldProps } from "./types";
