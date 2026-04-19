"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getPendingJoins(contestId: string) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, contestId),
    columns: { createdBy: true },
  });

  if (!owned || owned.createdBy !== currentUser.id) {
    throw new Error("Forbidden");
  }

  return db.query.userOnContest.findMany({
    where: and(
      eq(userOnContest.contestId, contestId),
      eq(userOnContest.joinStatus, "pending"),
    ),
    with: { user: true },
  });
}
