"use server";

import { eq } from "drizzle-orm";
import type { UpdateContestInput } from "@/hooks/use-update-contest";
import { db } from "@/lib/db";
import { contest } from "@/lib/db/schema";

export async function updateContest(input: UpdateContestInput) {
  await db
    .update(contest)
    .set(input.contest)
    .where(eq(contest.id, input.contestId));
}
