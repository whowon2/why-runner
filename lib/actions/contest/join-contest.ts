"use server";

import { db } from "@/drizzle/db";
import { userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { JoinContestInput } from "@/hooks/use-join-contest";

export async function joinContest(input: JoinContestInput) {
  const currentUser = await getCurrentUser({});
  await db
    .insert(userOnContest)
    .values({ userId: currentUser.id, contestId: input.contestId });
}
