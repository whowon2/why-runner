"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { JoinContestInput } from "@/hooks/use-join-contest";

export async function joinContest(input: JoinContestInput) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.contest.findFirst({
    where: eq(contest.id, input.contestId),
    columns: { startDate: true, endDate: true },
  });

  if (!found) throw new Error("Contest not found.");

  if (new Date() > found.endDate) throw new Error("Contest has already ended.");

  await db
    .insert(userOnContest)
    .values({ userId: currentUser.id, contestId: input.contestId })
    .onConflictDoNothing();
}
