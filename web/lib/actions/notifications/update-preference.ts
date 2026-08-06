"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type NotificationType, notificationPreference } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function updateNotificationPreference(
  type: NotificationType,
  enabled: boolean,
) {
  const currentUser = await getCurrentUser({});

  if (enabled) {
    await db
      .delete(notificationPreference)
      .where(
        and(
          eq(notificationPreference.userId, currentUser.id),
          eq(notificationPreference.type, type),
        ),
      );
    return;
  }

  await db
    .insert(notificationPreference)
    .values({ userId: currentUser.id, type })
    .onConflictDoNothing();
}
