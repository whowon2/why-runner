"use server";

import { and } from "drizzle-orm";
import { db } from "@/drizzle/db";
import type { GetUserSubmissionsOnContest } from "@/hooks/use-problem-submissions";

export async function getUserContestSubmissions(
  input: GetUserSubmissionsOnContest,
) {
  const submissions = await db.query.submission.findMany({
    where: (submissions, { eq }) =>
      and(
        eq(submissions.problemId, input.problemId),
        eq(submissions.contestId, input.contestId),
        eq(submissions.userId, input.userId),
      ),
    with: { user: true, problem: true },
  });

  return submissions;
}
