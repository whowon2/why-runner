"use server";

import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SURVEY_DEFINITIONS } from "@/lib/surveys/forms";
import {
  checkEligibility,
  findSurveyEntity,
  type SurveyEntity,
} from "@/lib/surveys/eligibility";
import { findOwnResponse, surveyTargetSchema } from "@/lib/surveys/responses";

export type SurveyState =
  | { status: "eligible"; entity: SurveyEntity }
  | { status: "answered"; entity: SurveyEntity; answeredAt: Date }
  | {
      status: "not_eligible";
      entity: SurveyEntity;
      /** The other form for the same entity, when the user can answer it. */
      alternative: SurveyFormKey | null;
    };

/**
 * Loads a questionnaire for the current user. `null` = unknown form or
 * entity (the page 404s). Never returns anyone's answers.
 */
export async function getSurvey(input: {
  form: string;
  entityId: string;
}): Promise<SurveyState | null> {
  const currentUser = await getCurrentUser({ redirectTo: "/auth/signin" });

  const parsed = surveyTargetSchema.safeParse(input);
  if (!parsed.success) return null;
  const { form, entityId } = parsed.data;

  const answeredAt = await findOwnResponse(currentUser.id, form, entityId);
  const eligible = await checkEligibility(currentUser.id, form, entityId);

  if (answeredAt) {
    const entity = eligible ?? (await findSurveyEntity(form, entityId));
    if (!entity) return null;
    return { status: "answered", entity, answeredAt };
  }
  if (eligible) return { status: "eligible", entity: eligible };

  const entity = await findSurveyEntity(form, entityId);
  if (!entity) return null;

  const entityKind = SURVEY_DEFINITIONS[form].entity;
  const other = (Object.keys(SURVEY_DEFINITIONS) as SurveyFormKey[]).find(
    (f) => f !== form && SURVEY_DEFINITIONS[f].entity === entityKind,
  );
  const alternative =
    other && (await checkEligibility(currentUser.id, other, entityId))
      ? other
      : null;

  return { status: "not_eligible", entity, alternative };
}
