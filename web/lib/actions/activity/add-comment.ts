"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityComment } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function addActivityComment(
  activityId: string,
  content: string,
  parentId?: string,
) {
  const currentUser = await getCurrentUser({});

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  if (parentId) {
    const parent = await db.query.activityComment.findFirst({
      where: eq(activityComment.id, parentId),
    });
    if (!parent) throw new Error("Parent comment not found");
    if (parent.parentId) throw new Error("Cannot reply to a reply");
  }

  const [comment] = await db
    .insert(activityComment)
    .values({ userId: currentUser.id, activityId, content: trimmed, parentId })
    .returning();

  return db.query.activityComment.findFirst({
    where: (c, { eq }) => eq(c.id, comment.id),
    with: { user: true },
  });
}
