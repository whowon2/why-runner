"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userOnContest } from "@/drizzle/schema";
import type { LeaveContestInput } from "@/hooks/use-leave-contest";

export async function leaveContest(input: LeaveContestInput) {
  await db
    .delete(userOnContest)
    .where(
      and(
        eq(userOnContest.userId, input.userId),
        eq(userOnContest.contestId, input.contestId),
      ),
    );
}
