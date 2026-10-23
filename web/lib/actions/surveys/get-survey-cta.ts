"use server";

import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/drizzle/db";
import { lessonSubmission } from "@/drizzle/schema";
import type { SurveyFormKey } from "@/drizzle/schemas/surveys";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkEligibility } from "@/lib/surveys/eligibility";
import { findOwnResponse } from "@/lib/surveys/responses";

const inputSchema = z.strictObject({
  kind: z.enum(["contest", "lesson"]),
  entityId: z.uuid(),
});

const FORMS_BY_KIND: Record<"contest" | "lesson", SurveyFormKey[]> = {
  contest: ["contest_author", "contest_participant"],
  lesson: ["lesson_author", "lesson_student"],
};

/**
 * The survey to invite the current user to from a contest or lesson page,
 * or `null`. Contest cards wait for `endDate`; the lesson author's card
 * waits for the first student hand-in.
 */
export async function getSurveyCta(
  input: unknown,
): Promise<{ form: SurveyFormKey; entityId: string } | null> {
  const currentUser = await getCurrentUser({});

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return null;
  const { kind, entityId } = parsed.data;

  for (const form of FORMS_BY_KIND[kind]) {
    const entity = await checkEligibility(currentUser.id, form, entityId);
    if (!entity || !entity.ended) continue;
    if (await findOwnResponse(currentUser.id, form, entityId)) continue;

    if (form === "lesson_author") {
      const handIn = await db.query.lessonSubmission.findFirst({
        where: eq(lessonSubmission.lessonId, entityId),
        columns: { lessonId: true },
      });
      if (!handIn) continue;
    }

    return { form, entityId };
  }
  return null;
}
