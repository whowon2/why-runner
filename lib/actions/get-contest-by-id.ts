"use server";

import { db } from "@/lib/db";

export async function getContest(id: number) {
  const contest = await db.query.contest.findFirst({
    where: (contests, { eq }) => eq(contests.id, id),
    with: {
      problems: {
        with: {
          problem: true,
        },
      },
      users: true,
    },
  });

  return contest;
}
