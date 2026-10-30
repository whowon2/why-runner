"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, problemOnContest } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest } from "@/lib/auth/permissions";
import { isContestLocked } from "@/lib/contest/editable";

export async function removeProblemFromContest(input: {
  contestId: string;
  problemId: string;
}): Promise<ActionResult<void, "CONTEST_STARTED">> {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { createdBy: true, status: true, startDate: true },
  });

  if (!owned || !(await canManageContest(owned, currentUser.id))) {
    throw new Error("Forbidden");
  }
  if (isContestLocked(owned)) return fail("CONTEST_STARTED");

  await db
    .delete(problemOnContest)
    .where(
      and(
        eq(problemOnContest.problemId, input.problemId),
        eq(problemOnContest.contestId, input.contestId),
      ),
    );

  return ok(undefined);
}
