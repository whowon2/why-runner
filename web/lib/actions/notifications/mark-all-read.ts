"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { notification } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function markAllNotificationsRead() {
  const currentUser = await getCurrentUser({});

  await db
    .update(notification)
    .set({ read: true })
    .where(
      and(
        eq(notification.recipientId, currentUser.id),
        eq(notification.read, false),
      ),
    );
}
