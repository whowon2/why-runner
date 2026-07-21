"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problemOnContest } from "@/drizzle/schema";
import type { RemoveProblemFromContestInput } from "@/hooks/use-remove-problem";

export async function removeProblemToContest(
  input: RemoveProblemFromContestInput,
) {
  await db
    .delete(problemOnContest)
    .where(
      and(
        eq(problemOnContest.problemId, input.problemId),
        eq(problemOnContest.contestId, input.contestId),
      ),
    );
}
