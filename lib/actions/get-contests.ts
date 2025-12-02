"use server";

import { db } from "@/lib/db";

export async function getContests() {
  const contests = await db.query.contest.findMany({
    with: {
      users: true,
    },
  });

  return contests;
}
