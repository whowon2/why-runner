"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problemOnContest, userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const problemColumns = { inputs: false, outputs: false } as const;

export async function getContest(id: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: (contests, { eq }) => eq(contests.id, id),
    with: {
      problems: {
        with: {
          problem: { columns: problemColumns },
        },
        orderBy: asc(problemOnContest.order),
      },
      users: true,
    },
  });

  if (!found) return null;

  const membership = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.contestId, id),
      eq(userOnContest.userId, currentUser.id),
    ),
    columns: { joinStatus: true },
  });

  const isOwner = found.createdBy === currentUser.id;
  const joinStatus = membership?.joinStatus ?? null;
  const canViewProblems =
    isOwner || !found.isPrivate || joinStatus === "accepted";

  return {
    ...found,
    joinStatus,
    problems: canViewProblems ? found.problems : [],
  };
}
