"use server";

import { db } from "@/drizzle/db";
import { publicUserColumns } from "@/lib/public-user";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redactSubmission } from "@/lib/judge-report";

export async function getProblemSubmissions(problemId: string) {
  const currentUser = await getCurrentUser({});

  const rows = await db.query.submission.findMany({
    where: (submissions, { and, eq }) =>
      and(
        eq(submissions.problemId, problemId),
        eq(submissions.userId, currentUser.id),
      ),
    orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
    with: {
      user: { columns: publicUserColumns },
      problem: { columns: { inputs: false, outputs: false } },
    },
  });

  return rows.map((row) => redactSubmission(row, currentUser.id));
}
