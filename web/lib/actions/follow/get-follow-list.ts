"use server";

import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { user, userFollow } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const PAGE_SIZE = 20;

function encodeCursor(
  createdAt: Date,
  followerId: string,
  followingId: string,
) {
  return Buffer.from(
    `${createdAt.toISOString()}_${followerId}_${followingId}`,
  ).toString("base64url");
}

function decodeCursor(cursor: string) {
  const [iso, followerId, followingId] = Buffer.from(cursor, "base64url")
    .toString()
    .split("_");
  return { createdAt: new Date(iso), followerId, followingId };
}

export async function getFollowList({
  username,
  tab,
  cursor,
  query,
  limit = PAGE_SIZE,
}: {
  username: string;
  tab: "followers" | "following";
  cursor?: string;
  query?: string;
  limit?: number;
}) {
  const target = await db.query.user.findFirst({
    where: eq(user.username, username),
  });
  if (!target) {
    return { users: [], nextCursor: null };
  }

  const currentUser = await getCurrentUser({});

  const relationFilter =
    tab === "followers"
      ? eq(userFollow.followingId, target.id)
      : eq(userFollow.followerId, target.id);

  const cursorFilter = cursor
    ? (() => {
        const decoded = decodeCursor(cursor);
        return or(
          lt(userFollow.createdAt, decoded.createdAt),
          and(
            eq(userFollow.createdAt, decoded.createdAt),
            lt(userFollow.followerId, decoded.followerId),
          ),
        );
      })()
    : undefined;

  const searchFilter = query?.trim()
    ? or(
        ilike(user.name, `%${query.trim()}%`),
        ilike(user.username, `%${query.trim()}%`),
      )
    : undefined;

  const where = [relationFilter, cursorFilter, searchFilter].filter(Boolean);

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      createdAt: userFollow.createdAt,
      followerId: userFollow.followerId,
      followingId: userFollow.followingId,
    })
    .from(userFollow)
    .innerJoin(
      user,
      eq(
        user.id,
        tab === "followers" ? userFollow.followerId : userFollow.followingId,
      ),
    )
    .where(and(...where))
    .orderBy(desc(userFollow.createdAt), desc(userFollow.followerId))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  const followedByMeIds =
    page.length > 0
      ? new Set(
          (
            await db
              .select({ followingId: userFollow.followingId })
              .from(userFollow)
              .where(
                and(
                  eq(userFollow.followerId, currentUser.id),
                  or(...page.map((u) => eq(userFollow.followingId, u.id))),
                ),
              )
          ).map((f) => f.followingId),
        )
      : new Set<string>();

  return {
    users: page.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      isFollowedByMe: followedByMeIds.has(u.id),
    })),
    nextCursor:
      hasMore && last
        ? encodeCursor(last.createdAt, last.followerId, last.followingId)
        : null,
  };
}
