"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom, classroomMembership } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function joinClass(code: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.classroom.findFirst({
    where: eq(classroom.joinCode, code.trim().toUpperCase()),
  });
  if (!found) throw new Error("Class not found for that code");

  // Owner already has full access to their own class; no membership row needed.
  if (found.createdBy !== currentUser.id) {
    await db
      .insert(classroomMembership)
      .values({ userId: currentUser.id, classroomId: found.id })
      .onConflictDoNothing();
  }

  return found;
}
