"use server";

import { and, eq } from "drizzle-orm";
import type { LeaveContestInput } from "@/hooks/use-leave-contest";
import { db } from "@/lib/db";
import { userOnContest } from "@/lib/db/schema";

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
