"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassOwner } from "@/lib/auth/permissions";

/** Owner or admin only — co-teachers cannot delete the class. */
export async function deleteClass(classroomId: string) {
  const currentUser = await getCurrentUser({});
  await assertClassOwner(classroomId, currentUser.id);

  await db.delete(classroom).where(eq(classroom.id, classroomId));
}
