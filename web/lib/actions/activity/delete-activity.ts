"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityFeed } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteActivity(activityId: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.activityFeed.findFirst({
    where: eq(activityFeed.id, activityId),
  });
  if (!existing) throw new Error("Activity not found");
  if (existing.userId !== currentUser.id) throw new Error("Forbidden");

  await db.delete(activityFeed).where(eq(activityFeed.id, activityId));
  return { success: true };
}
