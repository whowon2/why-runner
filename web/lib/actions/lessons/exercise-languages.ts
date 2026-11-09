"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { exercise } from "@/drizzle/schema";
import { allowedLanguagesSchema } from "@/lib/allowed-languages";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageExercise } from "@/lib/auth/permissions";

const inputSchema = z.object({
  exerciseId: z.string().min(1),
  languages: allowedLanguagesSchema,
});

export type SetExerciseAllowedLanguagesInput = z.input<typeof inputSchema>;

/**
 * Sets which languages students may use on a `code` mode exercise (empty =
 * any). Enforced by `createExerciseSubmission` and `createRun`.
 */
export async function setExerciseAllowedLanguages(
  rawInput: SetExerciseAllowedLanguagesInput,
) {
  const currentUser = await getCurrentUser({});
  const input = inputSchema.parse(rawInput);

  await assertCanManageExercise(input.exerciseId, currentUser.id);

  await db
    .update(exercise)
    .set({ allowedLanguages: input.languages })
    .where(eq(exercise.id, input.exerciseId));
}
