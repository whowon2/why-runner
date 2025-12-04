"use server";

import { db } from "@/lib/db";
import { contest } from "@/lib/db/schema";

export async function createContest(input: typeof contest.$inferInsert) {
  const [result] = await db.insert(contest).values(input).returning();

  return result;
}
