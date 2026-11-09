"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { contest, problemOnContest } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { allowedLanguagesSchema } from "@/lib/allowed-languages";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest } from "@/lib/auth/permissions";
import { isContestLocked } from "@/lib/contest/editable";

const inputSchema = z.object({
  contestId: z.string().min(1),
  problemId: z.string().min(1),
  languages: allowedLanguagesSchema,
});

export type SetContestProblemLanguagesInput = z.input<typeof inputSchema>;

/**
 * Sets which languages participants may use on one contest problem (empty =
 * any). Like the problem list itself, frozen once the contest has started.
 */
export async function setContestProblemLanguages(
  rawInput: SetContestProblemLanguagesInput,
): Promise<ActionResult<void, "CONTEST_STARTED">> {
  const currentUser = await getCurrentUser({});
  const input = inputSchema.parse(rawInput);

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { createdBy: true, status: true, startDate: true },
  });
  if (!owned || !(await canManageContest(owned, currentUser.id))) {
    throw new Error("Forbidden");
  }
  if (isContestLocked(owned)) return fail("CONTEST_STARTED");

  const updated = await db
    .update(problemOnContest)
    .set({ allowedLanguages: input.languages })
    .where(
      and(
        eq(problemOnContest.contestId, input.contestId),
        eq(problemOnContest.problemId, input.problemId),
      ),
    )
    .returning({ problemId: problemOnContest.problemId });
  if (updated.length === 0) throw new Error("Problem not found.");

  return ok(undefined);
}
