"use server";

import { and, count, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { contest, problem, problemOnContest } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest, isAdmin } from "@/lib/auth/permissions";
import { isContestLocked } from "@/lib/contest/editable";

const inputSchema = z.object({
  contestId: z.string().min(1),
  problemId: z.string().min(1),
});

export type AddProblemToContestInput = z.infer<typeof inputSchema>;

export async function addProblemToContest(
  rawInput: AddProblemToContestInput,
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

  // Other users' drafts are invisible, so they can't be attached either
  // (admins see every problem).
  const attachable = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, input.problemId),
      (await isAdmin(currentUser.id))
        ? undefined
        : or(
            eq(problem.status, "published"),
            eq(problem.createdBy, currentUser.id),
          ),
    ),
    columns: { id: true },
  });
  if (!attachable) throw new Error("Problem not found.");

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(problemOnContest)
    .where(eq(problemOnContest.contestId, input.contestId));

  await db.insert(problemOnContest).values({
    contestId: input.contestId,
    problemId: input.problemId,
    order: existingCount,
  });

  return ok(undefined);
}
