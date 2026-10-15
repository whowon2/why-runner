"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, problemOnContest } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isContestLocked } from "@/lib/contest/editable";

export async function reorderProblems(
  contestId: string,
  orderedProblemIds: string[],
): Promise<ActionResult<void, "CONTEST_STARTED">> {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, contestId),
    columns: { createdBy: true, status: true, startDate: true },
  });

  if (!owned || owned.createdBy !== currentUser.id) {
    throw new Error("Forbidden");
  }

  if (isContestLocked(owned)) return fail("CONTEST_STARTED");

  await Promise.all(
    orderedProblemIds.map((problemId, index) =>
      db
        .update(problemOnContest)
        .set({ order: index })
        .where(
          and(
            eq(problemOnContest.contestId, contestId),
            eq(problemOnContest.problemId, problemId),
          ),
        ),
    ),
  );

  return ok(undefined);
}
