"use server";

import z from "zod";
import { db } from "@/drizzle/db";
import { surveyResponse } from "@/drizzle/schema";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkEligibility } from "@/lib/surveys/eligibility";
import { SURVEY_DEFINITIONS } from "@/lib/surveys/forms";
import {
  entityColumns,
  findOwnResponse,
  isUniqueViolation,
  surveyTargetSchema,
} from "@/lib/surveys/responses";
import { answersSchema } from "@/lib/surveys/schema";
import { susScore } from "@/lib/surveys/sus";

const inputSchema = surveyTargetSchema.extend({
  consent: z.literal(true),
  answers: z.unknown(),
});

/**
 * Stores one evaluation questionnaire. Eligibility and the answer schema are
 * re-checked here (this is a public endpoint), the SUS score is computed
 * server-side, and the unique indexes reject a second response.
 */
export async function submitSurveyResponse(input: unknown) {
  const currentUser = await getCurrentUser({});

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return fail("SURVEY_INVALID");
  const { form, entityId } = parsed.data;
  const definition = SURVEY_DEFINITIONS[form];

  const answers = answersSchema(definition).safeParse(parsed.data.answers);
  if (!answers.success) return fail("SURVEY_INVALID");

  const entity = await checkEligibility(currentUser.id, form, entityId);
  if (!entity) return fail("SURVEY_NOT_ELIGIBLE");

  if (await findOwnResponse(currentUser.id, form, entityId)) {
    return fail("SURVEY_ALREADY_ANSWERED");
  }

  try {
    await db.insert(surveyResponse).values({
      userId: currentUser.id,
      form,
      formVersion: definition.version,
      ...entityColumns(form, entityId),
      entityName: entity.name,
      answers: answers.data,
      susScore: susScore(answers.data.sus),
      consentedAt: new Date(),
    });
  } catch (error) {
    if (isUniqueViolation(error)) return fail("SURVEY_ALREADY_ANSWERED");
    throw error;
  }

  return ok({ form, entityId });
}
