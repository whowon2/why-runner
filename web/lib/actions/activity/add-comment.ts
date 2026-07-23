"use server";

import { db } from "@/drizzle/db";
import { activityComment } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function addActivityComment(activityId: string, content: string) {
  const currentUser = await getCurrentUser({});

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const [comment] = await db
    .insert(activityComment)
    .values({ userId: currentUser.id, activityId, content: trimmed })
    .returning();

  return db.query.activityComment.findFirst({
    where: (c, { eq }) => eq(c.id, comment.id),
    with: { user: true },
  });
}
