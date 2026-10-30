"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageClass } from "@/lib/auth/permissions";

/**
 * Any class manager may remove a student; removing a co-teacher is
 * owner-level (owner or admin). The owner is never removable.
 */
export async function removeMember(classroomId: string, userId: string) {
  const currentUser = await getCurrentUser({});
  const { classroom, isOwner } = await assertCanManageClass(
    classroomId,
    currentUser.id,
  );

  if (userId === classroom.createdBy) {
    throw new Error("The class owner cannot be removed.");
  }

  const target = await db.query.classroomMembership.findFirst({
    where: and(
      eq(classroomMembership.classroomId, classroomId),
      eq(classroomMembership.userId, userId),
    ),
    columns: { role: true },
  });
  if (!target) return;
  if (target.role === "teacher" && !isOwner) throw new Error("Forbidden");

  await db
    .delete(classroomMembership)
    .where(
      and(
        eq(classroomMembership.classroomId, classroomId),
        eq(classroomMembership.userId, userId),
      ),
    );
}
