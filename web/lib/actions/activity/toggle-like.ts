"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityLike } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function toggleActivityLike(activityId: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.activityLike.findFirst({
    where: and(
      eq(activityLike.userId, currentUser.id),
      eq(activityLike.activityId, activityId),
    ),
  });

  if (existing) {
    await db.delete(activityLike).where(eq(activityLike.id, existing.id));
    return { liked: false };
  }

  await db
    .insert(activityLike)
    .values({ userId: currentUser.id, activityId })
    .onConflictDoNothing();

  return { liked: true };
}
