"use server";

import { db } from "@/drizzle/db";

export async function getContestLeaderboard(contestId: string) {
  const contests = await db.query.userOnContest.findMany({
    where: (c, { eq }) => eq(c.contestId, contestId),
    with: {
      user: true,
    },
  });

  return contests;
}
