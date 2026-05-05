"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

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

  const isOwner = owned?.createdBy === currentUser.id;

  return db.query.submission.findMany({
    where: (submissions, { and, eq }) => {
      const conditions = [eq(submissions.contestId, input.contestId)];
      if (!isOwner) conditions.push(eq(submissions.userId, currentUser.id));
      if (input.problemId)
        conditions.push(eq(submissions.problemId, input.problemId));
      return and(...conditions);
    },
    with: {
      user: true,
      problem: { columns: problemColumns },
    },
  });
}
