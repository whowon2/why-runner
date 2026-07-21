"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userOnContest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { LeaveContestInput } from "@/hooks/use-leave-contest";

export async function leaveContest(input: LeaveContestInput) {
  const currentUser = await getCurrentUser({});
  await db
    .delete(userOnContest)
    .where(
      and(
        eq(userOnContest.userId, currentUser.id),
        eq(userOnContest.contestId, input.contestId),
      ),
    );
}
