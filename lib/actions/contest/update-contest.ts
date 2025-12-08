"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import type { UpdateContestInput } from "@/hooks/use-update-contest";

export async function updateContest(input: UpdateContestInput) {
  await db
    .update(contest)
    .set(input.contest)
    .where(eq(contest.id, input.contestId));
}
