"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isClassStudent } from "@/lib/class-roles";

export async function listMyClasses() {
  const currentUser = await getCurrentUser({});

  const [owned, memberships] = await Promise.all([
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

  // The owner's own membership row (self-joined via the code) is not a
  // second entry: owned classes come from `createdBy`.
  const others = memberships.filter(
    (m) => m.classroom.createdBy !== currentUser.id,
  );
  const coTaught = others
    .filter((m) => m.role === "teacher")
    .map((m) => m.classroom);
  const joined = others
    .filter((m) => m.role === "student")
    .map((m) => m.classroom);

  const allClasses = [...owned, ...coTaught, ...joined];
  const createdByById = new Map(allClasses.map((c) => [c.id, c.createdBy]));
  const allIds = allClasses.map((c) => c.id);

  // Count students only — not the owner or co-teachers, same rule as `getClass`.
  const classMemberships = allIds.length
    ? await db.query.classroomMembership.findMany({
        where: inArray(classroomMembership.classroomId, allIds),
        columns: { classroomId: true, userId: true, role: true },
      })
    : [];

  const memberCountById = new Map<string, number>();
  for (const m of classMemberships) {
    const createdBy = createdByById.get(m.classroomId);
    if (!createdBy || !isClassStudent(m, createdBy)) continue;
    memberCountById.set(
      m.classroomId,
      (memberCountById.get(m.classroomId) ?? 0) + 1,
    );
  }

  const withCount = <T extends { id: string }>(c: T) => ({
    ...c,
    memberCount: memberCountById.get(c.id) ?? 0,
  });

  return {
    taught: [
      ...owned.map((c) => ({ ...withCount(c), role: "owner" as const })),
      ...coTaught.map((c) => ({ ...withCount(c), role: "teacher" as const })),
    ],
    joined: joined.map(withCount),
  };
}
