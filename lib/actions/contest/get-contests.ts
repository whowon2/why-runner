"use server";

import { db } from "@/drizzle/db";

export async function getContests() {
  const contests = await db.query.contest.findMany({
    with: {
      users: true,
    },
  });

  return contests;
}
