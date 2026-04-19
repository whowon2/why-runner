"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const problemColumns = { inputs: false, outputs: false } as const;

export async function getContestSubmissions(input: { contestId: string }) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { createdBy: true },
  });

  const isOwner = owned?.createdBy === currentUser.id;

  return db.query.submission.findMany({
    where: (submissions, { and, eq }) =>
      isOwner
        ? eq(submissions.contestId, input.contestId)
        : and(
            eq(submissions.contestId, input.contestId),
            eq(submissions.userId, currentUser.id),
          ),
    with: {
      user: true,
      problem: { columns: problemColumns },
    },
  });
}
