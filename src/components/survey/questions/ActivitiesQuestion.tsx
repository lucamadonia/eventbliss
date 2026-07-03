import ActivityPreferencesSection from "../ActivityPreferencesSection";
import type { CoreQuestionProps } from "./types";

const ActivitiesQuestion = ({ control, config, questionConfig }: CoreQuestionProps) => {
  if (questionConfig?.activities?.enabled === false) return null;

  return (
    <ActivityPreferencesSection
      control={control}
      activityOptions={config.activity_options}
    />
  );
};

export default ActivitiesQuestion;
