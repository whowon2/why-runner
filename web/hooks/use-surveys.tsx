import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { getSurvey } from "@/lib/actions/surveys/get-survey";
import { getSurveyCta } from "@/lib/actions/surveys/get-survey-cta";
import { getSurveyResults } from "@/lib/actions/surveys/get-survey-results";
import { listMySurveys } from "@/lib/actions/surveys/list-my-surveys";
import { submitSurveyResponse } from "@/lib/actions/surveys/submit-survey-response";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import type { SurveyAnswers } from "@/lib/surveys/forms";

// Eligibility depends on contests, lessons and submissions changed all over
// the app, so survey queries always refetch on mount instead of trusting the
// app-wide staleTime.
const fresh = { staleTime: 0 } as const;

export const useMySurveys = () =>
  useQuery({
    queryKey: ["surveys", "mine"],
    queryFn: () => listMySurveys(),
    ...fresh,
  });

export const useSurvey = (form: string, entityId: string) =>
  useQuery({
    queryKey: ["surveys", "survey", form, entityId],
    queryFn: () => getSurvey({ form, entityId }),
    ...fresh,
  });

export const useSurveyCta = (kind: "contest" | "lesson", entityId: string) =>
  useQuery({
    queryKey: ["surveys", "cta", kind, entityId],
    queryFn: () => getSurveyCta({ kind, entityId }),
    ...fresh,
  });

export const useSurveyResults = (form: SurveyFormKey, entityId?: string) =>
  useQuery({
    queryKey: ["surveys", "results", form, entityId ?? null],
    queryFn: () => getSurveyResults({ form, entityId }),
    ...fresh,
  });

export const useSubmitSurveyResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      form: SurveyFormKey;
      entityId: string;
      consent: true;
      answers: SurveyAnswers;
    }) => unwrap(await submitSurveyResponse(input)),
    onSuccess: () => {
      // Hub lists, CTA cards, this survey's state and results all change.
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
};
