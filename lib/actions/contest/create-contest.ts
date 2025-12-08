"use server";

import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";

export async function createContest(input: typeof contest.$inferInsert) {
  const [result] = await db.insert(contest).values(input).returning();

  return result;
}
