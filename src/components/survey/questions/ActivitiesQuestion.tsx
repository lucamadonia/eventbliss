import SurveyQuestionWrapper from "../SurveyQuestionWrapper";
import ActivityPreferencesSection from "../ActivityPreferencesSection";
import type { CoreQuestionProps } from "./types";

const ActivitiesQuestion = ({ control, config, questionConfig }: CoreQuestionProps) => {
  if (questionConfig?.activities?.enabled === false) return null;

  return (
    <SurveyQuestionWrapper>
      <ActivityPreferencesSection
        control={control}
        activityOptions={config.activity_options}
      />
    </SurveyQuestionWrapper>
  );
};

export default ActivitiesQuestion;
