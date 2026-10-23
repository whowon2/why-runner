import z from "zod";
import {
  LIKERT_VALUES,
  NOT_APPLICABLE,
  OPEN_ANSWER_MAX,
  SUS_KEYS,
  type SurveyDefinition,
} from "./forms";

const likert = z.union(LIKERT_VALUES.map((v) => z.literal(v)));

/**
 * Builds the strict answer schema for one form: every required item
 * answered, values in the allowed set, "na" only on optional items, unknown
 * keys rejected. Shared by the form (client) and `submitSurveyResponse`.
 */
export function answersSchema(definition: SurveyDefinition) {
  const profile: Record<string, z.ZodType> = {};
  for (const q of definition.profile) {
    if (q.kind === "single") {
      profile[q.key] = z.enum(q.options as [string, ...string[]]);
    } else if (q.kind === "multi") {
      profile[q.key] = z
        .array(z.enum(q.options as [string, ...string[]]))
        .min(1)
        .refine((a) => new Set(a).size === a.length);
    } else {
      profile[q.key] = z.string().trim().min(1).max(q.maxLength);
    }
  }

  const sus = Object.fromEntries(SUS_KEYS.map((k) => [k, likert]));

  const items = Object.fromEntries(
    definition.items.map((item) => [
      item.key,
      item.optional ? z.union([likert, z.literal(NOT_APPLICABLE)]) : likert,
    ]),
  );

  const open = Object.fromEntries(
    definition.open.map((q) => [
      q.key,
      q.required
        ? z.string().trim().min(1).max(OPEN_ANSWER_MAX)
        : z.string().trim().max(OPEN_ANSWER_MAX).default(""),
    ]),
  );

  return z.strictObject({
    profile: z.strictObject(profile),
    sus: z.strictObject(sus),
    items: z.strictObject(items),
    open: z.strictObject(open),
  });
}
