"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityComment, activityLike } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getActivityEngagement(activityIds: string[]) {
  if (activityIds.length === 0) return {};

  const currentUser = await getCurrentUser({});

  const [likes, comments, myLikes] = await Promise.all([
    db
      .select()
      .from(activityLike)
      .where(inArray(activityLike.activityId, activityIds)),
    db.query.activityComment.findMany({
      where: inArray(activityComment.activityId, activityIds),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      with: { user: true },
    }),
    db
      .select()
      .from(activityLike)
      .where(
        and(
          eq(activityLike.userId, currentUser.id),
          inArray(activityLike.activityId, activityIds),
        ),
      ),
  ]);

  const likedActivityIds = new Set(myLikes.map((l) => l.activityId));

  return Object.fromEntries(
    activityIds.map((id) => [
      id,
      {
        likeCount: likes.filter((l) => l.activityId === id).length,
        isLiked: likedActivityIds.has(id),
        comments: comments.filter((c) => c.activityId === id),
      },
    ]),
  );
}
