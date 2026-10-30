"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { publicUserColumns } from "@/lib/public-user";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageContest } from "@/lib/auth/permissions";
import { redactSubmission } from "@/lib/judge-report";

const problemColumns = { inputs: false, outputs: false } as const;

export async function getContestSubmissions(input: {
  contestId: string;
  problemId?: string;
  userId?: string;
}) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { createdBy: true },
  });

  const isOwner = !!owned && (await canManageContest(owned, currentUser.id));

  const rows = await db.query.submission.findMany({
    where: (submissions, { and, eq }) => {
      const conditions = [eq(submissions.contestId, input.contestId)];
      if (!isOwner) conditions.push(eq(submissions.userId, currentUser.id));
      if (input.problemId)
        conditions.push(eq(submissions.problemId, input.problemId));
      return and(...conditions);
    },
    with: {
      user: { columns: publicUserColumns },
      problem: { columns: problemColumns },
    },
  });

  return rows.map((row) => redactSubmission(row, currentUser.id));
}
