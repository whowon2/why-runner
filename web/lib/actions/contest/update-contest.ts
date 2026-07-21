"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { UpdateContestInput } from "@/hooks/use-update-contest";

export async function updateContest(input: UpdateContestInput) {
  const currentUser = await getCurrentUser({});
  await db
    .update(contest)
    .set(input.contest)
    .where(
      and(
        eq(contest.id, input.contestId),
        eq(contest.createdBy, currentUser.id),
      ),
    );
}
