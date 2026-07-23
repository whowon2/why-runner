"use server";

import { and, count, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { userFollow } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getFollowState(targetUserId: string) {
  const currentUser = await getCurrentUser({});

  const [followerCountResult, followingCountResult, existing] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(userFollow)
        .where(eq(userFollow.followingId, targetUserId)),
      db
        .select({ value: count() })
        .from(userFollow)
        .where(eq(userFollow.followerId, targetUserId)),
      db.query.userFollow.findFirst({
        where: and(
          eq(userFollow.followerId, currentUser.id),
          eq(userFollow.followingId, targetUserId),
        ),
      }),
    ]);

  return {
    isFollowing: Boolean(existing),
    followerCount: followerCountResult[0]?.value ?? 0,
    followingCount: followingCountResult[0]?.value ?? 0,
  };
}
