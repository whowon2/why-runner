"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom, classroomMembership } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function leaveClass(classroomId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.classroom.findFirst({
    where: eq(classroom.id, classroomId),
    columns: { createdBy: true },
  });

  if (!found) throw new Error("Class not found.");
  if (found.createdBy === currentUser.id) {
    throw new Error("Owner cannot leave their own class. Delete it instead.");
  }

  await db
    .delete(classroomMembership)
    .where(
      and(
        eq(classroomMembership.classroomId, classroomId),
        eq(classroomMembership.userId, currentUser.id),
      ),
    );
}
