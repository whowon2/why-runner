"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityComment } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteActivityComment(commentId: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.activityComment.findFirst({
    where: eq(activityComment.id, commentId),
  });
  if (!existing) throw new Error("Comment not found");
  if (existing.userId !== currentUser.id) throw new Error("Forbidden");

  await db.delete(activityComment).where(eq(activityComment.id, commentId));
  return { success: true };
}
