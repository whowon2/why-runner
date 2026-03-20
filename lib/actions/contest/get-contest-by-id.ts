"use server";

import { db } from "@/drizzle/db";

export async function getContest(id: string) {
  return await db.query.contest.findFirst({
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
}
