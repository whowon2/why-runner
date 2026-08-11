"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lessonConstraint } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteLessonConstraint(id: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.lessonConstraint.findFirst({
    where: eq(lessonConstraint.id, id),
    with: { lesson: { with: { track: { columns: { createdBy: true } } } } },
  });

  if (!existing || existing.lesson.track.createdBy !== currentUser.id) {
    throw new Error("Constraint not found.");
  }

  await db.delete(lessonConstraint).where(eq(lessonConstraint.id, id));
}
