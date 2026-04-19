"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function approveJoin(contestId: string, userId: string) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.contest.findFirst({
    where: eq(contest.id, contestId),
    columns: { createdBy: true },
  });

  if (!owned || owned.createdBy !== currentUser.id) {
    throw new Error("Forbidden");
  }

  await db
    .update(userOnContest)
    .set({ joinStatus: "accepted" })
    .where(
      and(
        eq(userOnContest.contestId, contestId),
        eq(userOnContest.userId, userId),
      ),
    );
}
