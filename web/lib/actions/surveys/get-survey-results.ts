"use server";

import z from "zod";
import { SURVEY_FORMS } from "@/drizzle/schemas/surveys";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSurveyAdmin } from "@/lib/surveys/admin";
import { aggregate, type FormResults } from "@/lib/surveys/aggregate";
import { SURVEY_DEFINITIONS } from "@/lib/surveys/forms";
import { loadResponses } from "@/lib/surveys/results";

const inputSchema = z.strictObject({
  form: z.enum(SURVEY_FORMS),
  entityId: z.uuid().optional(),
});

export type SurveyResultsData = FormResults & {
  /** Contests/lessons with at least one response, for the filter. */
  entities: { id: string; name: string }[];
};

/** Aggregated, anonymous results of one form. Researcher-only. */
export async function getSurveyResults(
  input: unknown,
): Promise<SurveyResultsData | null> {
  const currentUser = await getCurrentUser({});
  if (!isSurveyAdmin(currentUser)) return null;

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return null;
  const { form, entityId } = parsed.data;

  const all = await loadResponses(form);
  const entities = new Map<string, string>();
  for (const r of all) if (r.entityId) entities.set(r.entityId, r.entityName);

  const rows = entityId ? all.filter((r) => r.entityId === entityId) : all;

  return {
    ...aggregate(SURVEY_DEFINITIONS[form], rows),
    entities: [...entities].map(([id, name]) => ({ id, name })),
  };
}
