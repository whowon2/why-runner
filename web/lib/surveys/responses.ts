import "server-only";

import { and, eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/drizzle/db";
import { surveyResponse } from "@/drizzle/schema";
import { SURVEY_FORMS, type SurveyFormKey } from "@/drizzle/schemas/surveys";
import { SURVEY_DEFINITIONS } from "./forms";

export const surveyTargetSchema = z.strictObject({
  form: z.enum(SURVEY_FORMS),
  entityId: z.uuid(),
});

/** The FK column a form's entity id goes in. */
export function entityColumns(form: SurveyFormKey, entityId: string) {
  return SURVEY_DEFINITIONS[form].entity === "contest"
    ? { contestId: entityId, lessonId: null }
    : { contestId: null, lessonId: entityId };
}

/** When this user answered `form` for the entity, or `null`. */
export async function findOwnResponse(
  userId: string,
  form: SurveyFormKey,
  entityId: string,
): Promise<Date | null> {
  const column =
    SURVEY_DEFINITIONS[form].entity === "contest"
      ? surveyResponse.contestId
      : surveyResponse.lessonId;
  const [row] = await db
    .select({ createdAt: surveyResponse.createdAt })
    .from(surveyResponse)
    .where(
      and(
        eq(surveyResponse.userId, userId),
        eq(surveyResponse.form, form),
        eq(column, entityId),
      ),
    );
  return row?.createdAt ?? null;
}

/** Postgres unique-violation, possibly wrapped by drizzle. */
export function isUniqueViolation(error: unknown): boolean {
  for (
    let e = error;
    e && typeof e === "object";
    e = (e as { cause?: unknown }).cause
  ) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}
