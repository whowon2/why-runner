"use server";

import { and, eq } from "drizzle-orm";
import type { RemoveProblemFromContestInput } from "@/hooks/use-remove-problem";
import { db } from "@/lib/db";
import { problemOnContest } from "@/lib/db/schema";

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
