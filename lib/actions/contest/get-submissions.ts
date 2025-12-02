"use server";

import { and } from "drizzle-orm";
import type { GetUserSubmissionsOnContest } from "@/hooks/use-problem-submissions";
import { db } from "@/lib/db";

export async function getContestSubmissions(
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
