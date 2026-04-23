"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getUserContestStatus(contestId: string) {
  const user = await getCurrentUser({});
  const row = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.contestId, contestId),
      eq(userOnContest.userId, user.id),
    ),
    columns: { answered: true },
  });
  return row?.answered ?? [];
}
