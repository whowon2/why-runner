"use server";

import { eq, inArray } from "drizzle-orm";
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

  const allClasses = [...owned, ...joinedClasses];
  const createdByById = new Map(allClasses.map((c) => [c.id, c.createdBy]));
  const allIds = allClasses.map((c) => c.id);

  // The owner can hold their own membership row too (e.g. self-joined via
  // the code) — count actual students only, same rule as `getClass`.
  const memberships = allIds.length
    ? await db.query.classroomMembership.findMany({
        where: inArray(classroomMembership.classroomId, allIds),
        columns: { classroomId: true, userId: true },
      })
    : [];

  const memberCountById = new Map<string, number>();
  for (const m of memberships) {
    if (m.userId === createdByById.get(m.classroomId)) continue;
    memberCountById.set(
      m.classroomId,
      (memberCountById.get(m.classroomId) ?? 0) + 1,
    );
  }

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
