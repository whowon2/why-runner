"use server";

import { db } from "@/lib/db";
import { contest } from "@/lib/db/schema";

export async function createContest(input: typeof contest.$inferInsert) {
  await db.insert(contest).values(input);
}
