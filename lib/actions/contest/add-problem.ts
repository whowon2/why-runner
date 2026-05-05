"use server";

import { count, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, problemOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { AddProblemToContestInput } from "@/hooks/use-add-problem";

export async function addProblemToContest(input: AddProblemToContestInput) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { createdBy: true },
  });

  if (!owned || owned.createdBy !== currentUser.id) {
    throw new Error("Forbidden");
  }

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(problemOnContest)
    .where(eq(problemOnContest.contestId, input.contestId));

  await db.insert(problemOnContest).values({ ...input, order: existingCount });
}
