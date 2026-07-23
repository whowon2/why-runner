"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userFollow } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function toggleFollow(targetUserId: string) {
  const currentUser = await getCurrentUser({});

  if (targetUserId === currentUser.id) {
    throw new Error("Cannot follow yourself");
  }

  const existing = await db.query.userFollow.findFirst({
    where: and(
      eq(userFollow.followerId, currentUser.id),
      eq(userFollow.followingId, targetUserId),
    ),
  });

  if (existing) {
    await db
      .delete(userFollow)
      .where(
        and(
          eq(userFollow.followerId, currentUser.id),
          eq(userFollow.followingId, targetUserId),
        ),
      );
    return { following: false };
  }

  await db
    .insert(userFollow)
    .values({ followerId: currentUser.id, followingId: targetUserId })
    .onConflictDoNothing();

  return { following: true };
}
