"use server";

import { db } from "@/drizzle/db";
import { userOnContest } from "@/drizzle/schema";
import type { JoinContestInput } from "@/hooks/use-join-contest";

export async function joinContest(input: JoinContestInput) {
  await db
    .insert(userOnContest)
    .values({ userId: input.userId, contestId: input.contestId });
}
