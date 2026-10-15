"use server";

import { db } from "@/drizzle/db";
import { publicUserColumns } from "@/lib/public-user";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redactSubmission } from "@/lib/judge-report";
import type { GetUserSubmissionsOnContest } from "@/hooks/use-problem-submissions";

export async function getUserContestSubmissions(
  input: Omit<GetUserSubmissionsOnContest, "userId">,
) {
  const currentUser = await getCurrentUser({});

  const rows = await db.query.submission.findMany({
    where: (submissions, { and, eq }) =>
      and(
        eq(submissions.problemId, input.problemId),
        eq(submissions.contestId, input.contestId),
        eq(submissions.userId, currentUser.id),
      ),
    with: {
      user: { columns: publicUserColumns },
      problem: { columns: { inputs: false, outputs: false } },
    },
  });

  return rows.map((row) => redactSubmission(row, currentUser.id));
}
