"use server";

import { and, count, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { notification } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getUnreadNotificationCount() {
  const currentUser = await getCurrentUser({});

  const [result] = await db
    .select({ value: count() })
    .from(notification)
    .where(
      and(
        eq(notification.recipientId, currentUser.id),
        eq(notification.read, false),
      ),
    );

  return result?.value ?? 0;
}
