"use server";

import { db } from "@/lib/db";

export async function getContestLeaderboard(contestId: number) {
  const contests = await db.query.userOnContest.findMany({
    where: (c, { eq }) => eq(c.contestId, contestId),
    with: {
      user: true,
    },
  });

  return contests;
}
