"use server";

import { db } from "@/drizzle/db";

export async function getContestLeaderboard(contestId: string) {
  return db.query.userOnContest.findMany({
    where: (c, { and, eq }) =>
      and(eq(c.contestId, contestId), eq(c.joinStatus, "accepted")),
    with: { user: true },
  });
}
