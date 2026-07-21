"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, problemOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function reorderProblems(
  contestId: string,
  orderedProblemIds: string[],
) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, contestId),
    columns: { createdBy: true, startDate: true },
  });

  if (!owned || owned.createdBy !== currentUser.id) {
    throw new Error("Forbidden");
  }

  if (new Date() >= owned.startDate) {
    throw new Error("Contest has already started.");
  }

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
}
