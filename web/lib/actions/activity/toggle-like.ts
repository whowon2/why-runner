"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityFeed, activityLike } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notifyActivityLike, notifyActivityUnlike } from "@/lib/notifications";

export async function toggleActivityLike(activityId: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.activityLike.findFirst({
    where: and(
      eq(activityLike.userId, currentUser.id),
      eq(activityLike.activityId, activityId),
    ),
  });

  const activity = await db.query.activityFeed.findFirst({
    where: eq(activityFeed.id, activityId),
    columns: { userId: true },
  });

  if (existing) {
    await db.delete(activityLike).where(eq(activityLike.id, existing.id));
    if (activity) {
      await notifyActivityUnlike(currentUser.id, activity.userId, activityId);
    }
    return { liked: false };
  }

  await db
    .insert(activityLike)
    .values({ userId: currentUser.id, activityId })
    .onConflictDoNothing();

  if (activity) {
    await notifyActivityLike(currentUser.id, activity.userId, activityId);
  }

  return { liked: true };
}
