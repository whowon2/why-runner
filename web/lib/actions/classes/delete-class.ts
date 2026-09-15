"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteClass(classroomId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.classroom.findFirst({
    where: eq(classroom.id, classroomId),
    columns: { createdBy: true },
  });

  if (!found) throw new Error("Class not found.");
  if (found.createdBy !== currentUser.id) throw new Error("Forbidden");

  await db.delete(classroom).where(eq(classroom.id, classroomId));
}
