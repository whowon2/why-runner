"use server";

import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function listMyClasses() {
  const currentUser = await getCurrentUser({});

  const [owned, joined] = await Promise.all([
    db.query.classroom.findMany({
      where: (c, { eq }) => eq(c.createdBy, currentUser.id),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    }),
    db.query.classroomMembership.findMany({
      where: eq(classroomMembership.userId, currentUser.id),
      with: { classroom: true },
      orderBy: (m, { desc }) => [desc(m.joinedAt)],
    }),
  ]);

  const joinedClasses = joined
    .map((m) => m.classroom)
    .filter((c) => c.createdBy !== currentUser.id);

  const allIds = [...owned, ...joinedClasses].map((c) => c.id);
  const memberCounts = allIds.length
    ? await db
        .select({
          classroomId: classroomMembership.classroomId,
          value: count(),
        })
        .from(classroomMembership)
        .where(inArray(classroomMembership.classroomId, allIds))
        .groupBy(classroomMembership.classroomId)
    : [];
  const memberCountById = new Map(
    memberCounts.map((r) => [r.classroomId, r.value]),
  );

  return {
    owned: owned.map((c) => ({
      ...c,
      memberCount: memberCountById.get(c.id) ?? 0,
    })),
    joined: joinedClasses.map((c) => ({
      ...c,
      memberCount: memberCountById.get(c.id) ?? 0,
    })),
  };
}
