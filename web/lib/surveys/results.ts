import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { surveyResponse } from "@/drizzle/schema";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { SURVEY_DEFINITIONS } from "./forms";

/**
 * One form's responses, oldest first, optionally narrowed to one contest or
 * lesson. Deliberately selects no user columns: results and the CSV export
 * are anonymous.
 */
export async function loadResponses(form: SurveyFormKey, entityId?: string) {
  const column =
    SURVEY_DEFINITIONS[form].entity === "contest"
      ? surveyResponse.contestId
      : surveyResponse.lessonId;

  const rows = await db
    .select({
      id: surveyResponse.id,
      formVersion: surveyResponse.formVersion,
      contestId: surveyResponse.contestId,
      lessonId: surveyResponse.lessonId,
      entityName: surveyResponse.entityName,
      answers: surveyResponse.answers,
      susScore: surveyResponse.susScore,
      createdAt: surveyResponse.createdAt,
    })
    .from(surveyResponse)
    .where(
      and(
        eq(surveyResponse.form, form),
        entityId ? eq(column, entityId) : undefined,
      ),
    )
    .orderBy(asc(surveyResponse.createdAt));

  return rows.map(({ contestId, lessonId, ...r }) => ({
    ...r,
    entityId: contestId ?? lessonId,
  }));
}
