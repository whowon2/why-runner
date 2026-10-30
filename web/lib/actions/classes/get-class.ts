"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership, user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassMember } from "@/lib/auth/permissions";
import { isClassStudent } from "@/lib/class-roles";
import { publicUserColumns } from "@/lib/public-user";

export async function getClass(classroomId: string) {
  const currentUser = await getCurrentUser({});
  const { classroom, role, canManage, isOwner } = await assertClassMember(
    classroomId,
    currentUser.id,
  );

  const [memberships, owner] = await Promise.all([
    db.query.classroomMembership.findMany({
      where: eq(classroomMembership.classroomId, classroomId),
      // RA is private, but only class managers receive the roster below.
      with: { user: { columns: { ...publicUserColumns, ra: true } } },
      orderBy: (m, { asc }) => [asc(m.joinedAt)],
    }),
    db.query.user.findFirst({
      where: eq(user.id, classroom.createdBy),
      columns: publicUserColumns,
    }),
  ]);
  const students = memberships.filter((m) =>
    isClassStudent(m, classroom.createdBy),
  );
  const coTeachers = memberships.filter(
    (m) => m.role === "teacher" && m.userId !== classroom.createdBy,
  );

  return {
    classroom,
    role,
    canManage,
    isOwner,
    memberCount: students.length,
    // The roster is only meaningful to managers; students don't need
    // classmates' identities exposed.
    owner: canManage ? (owner ?? null) : null,
    coTeachers: canManage ? coTeachers.map((m) => m.user) : [],
    members: canManage ? students.map((m) => m.user) : [],
  };
}
