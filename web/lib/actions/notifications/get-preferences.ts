"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { NotificationType, notificationPreference } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getNotificationPreferences() {
  const currentUser = await getCurrentUser({});

  const disabled = await db.query.notificationPreference.findMany({
    where: eq(notificationPreference.userId, currentUser.id),
    columns: { type: true },
  });
  const disabledSet = new Set(disabled.map((d) => d.type));

  return NotificationType.enumValues.map((type) => ({
    type,
    enabled: !disabledSet.has(type),
  }));
}
