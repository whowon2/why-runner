"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership } from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getClass(classroomId: string) {
  const currentUser = await getCurrentUser({});
  const found = await assertClassMember(classroomId, currentUser.id);
  const isOwner = found.createdBy === currentUser.id;

  const memberships = await db.query.classroomMembership.findMany({
    where: eq(classroomMembership.classroomId, classroomId),
    with: { user: true },
    orderBy: (m, { asc }) => [asc(m.joinedAt)],
  });
  // The owner isn't a "student" even if they hold a membership row (e.g. self-joined via the code).
  const students = memberships.filter((m) => m.userId !== found.createdBy);

  return {
    classroom: found,
    isOwner,
    memberCount: students.length,
    // Roster is only meaningful to the owner; members don't need classmates' identities exposed.
    members: isOwner ? students.map((m) => m.user) : [],
  };
}
