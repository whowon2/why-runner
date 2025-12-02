"use server";

import type { JoinContestInput } from "@/hooks/use-join-contest";
import { db } from "@/lib/db";
import { userOnContest } from "@/lib/db/schema";

export async function joinContest(input: JoinContestInput) {
  await db
    .insert(userOnContest)
    .values({ userId: input.userId, contestId: input.contestId });
}
