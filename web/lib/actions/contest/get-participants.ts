"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { publicUserColumns } from "@/lib/public-user";
import { contest, userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getParticipants(contestId: string) {
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
      eq(userOnContest.joinStatus, "accepted"),
    ),
    with: { user: { columns: publicUserColumns } },
  });
}
