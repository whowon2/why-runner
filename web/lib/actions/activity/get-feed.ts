"use server";

import { and, desc, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { activityFeed, userFollow } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const PAGE_SIZE = 20;

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}_${id}`).toString("base64url");
}

function decodeCursor(cursor: string) {
  const [iso, id] = Buffer.from(cursor, "base64url").toString().split("_");
  return { createdAt: new Date(iso), id };
}

export async function getFeed({
  scope,
  cursor,
  limit = PAGE_SIZE,
}: {
  scope: "following" | "explore";
  cursor?: string;
  limit?: number;
}) {
  const currentUser = await getCurrentUser({});

  let scopeFilter = undefined;
  if (scope === "following") {
    const follows = await db
      .select({ followingId: userFollow.followingId })
      .from(userFollow)
      .where(eq(userFollow.followerId, currentUser.id));

    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    scopeFilter = inArray(activityFeed.userId, followingIds);
  }

  const cursorFilter = cursor
    ? (() => {
        const { createdAt, id } = decodeCursor(cursor);
        return or(
          lt(activityFeed.createdAt, createdAt),
          and(eq(activityFeed.createdAt, createdAt), lt(activityFeed.id, id)),
        );
      })()
    : undefined;

  const where = [scopeFilter, cursorFilter].filter(Boolean);

  const items = await db.query.activityFeed.findMany({
    where: where.length > 0 ? and(...where) : undefined,
    orderBy: [desc(activityFeed.createdAt), desc(activityFeed.id)],
    limit: limit + 1,
    with: {
      user: true,
      contest: true,
      problem: true,
    },
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const last = page[page.length - 1];

  return {
    items: page,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}
