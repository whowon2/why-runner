"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { GetUserSubmissionsOnContest } from "@/hooks/use-problem-submissions";

export async function getUserContestSubmissions(
  input: Omit<GetUserSubmissionsOnContest, "userId">,
) {
  const currentUser = await getCurrentUser({});

  return db.query.submission.findMany({
    where: (submissions, { and, eq }) =>
      and(
        eq(submissions.problemId, input.problemId),
        eq(submissions.contestId, input.contestId),
        eq(submissions.userId, currentUser.id),
      ),
    with: {
      user: true,
      problem: { columns: { inputs: false, outputs: false } },
    },
  });
}
