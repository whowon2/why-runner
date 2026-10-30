"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { surveyResponse } from "@/drizzle/schema";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canPreviewSurveys, isSurveyAdmin } from "@/lib/surveys/admin";
import { type SurveyEntity, listEligible } from "@/lib/surveys/eligibility";

export type MySurvey = {
  form: SurveyFormKey;
  entity: SurveyEntity;
};

export type AnsweredSurvey = {
  form: SurveyFormKey;
  entityId: string | null;
  entityName: string;
  answeredAt: Date;
};

/** The current user's pending and answered surveys, for the hub and CTAs. */
export async function listMySurveys(): Promise<{
  pending: MySurvey[];
  answered: AnsweredSurvey[];
  isAdmin: boolean;
  canPreview: boolean;
}> {
  const currentUser = await getCurrentUser({});

  const [eligible, responses] = await Promise.all([
    listEligible(currentUser.id),
    db
      .select({
        form: surveyResponse.form,
        contestId: surveyResponse.contestId,
        lessonId: surveyResponse.lessonId,
        entityName: surveyResponse.entityName,
        createdAt: surveyResponse.createdAt,
      })
      .from(surveyResponse)
      .where(eq(surveyResponse.userId, currentUser.id))
      .orderBy(desc(surveyResponse.createdAt)),
  ]);

  const answered = responses.map((r) => ({
    form: r.form,
    entityId: r.contestId ?? r.lessonId,
    entityName: r.entityName,
    answeredAt: r.createdAt,
  }));
  const answeredKeys = new Set(answered.map((a) => `${a.form}:${a.entityId}`));

  return {
    pending: eligible.filter(
      (e) => !answeredKeys.has(`${e.form}:${e.entity.id}`),
    ),
    answered,
    isAdmin: await isSurveyAdmin(currentUser),
    canPreview: await canPreviewSurveys(currentUser),
  };
}
