"use server";

import { db } from "@/drizzle/db";
import { activityFeed } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function createActivity({
  type,
  description,
  contestId,
  problemId,
}: {
  type: string;
  description?: string;
  contestId?: string;
  problemId?: string;
}) {
  const user = await getCurrentUser({});
  if (!user) throw new Error("Unauthorized");

  const [activity] = await db
    .insert(activityFeed)
    .values({
      userId: user.id,
      type,
      description,
      contestId,
      problemId,
    })
    .returning();

  return activity;
}
