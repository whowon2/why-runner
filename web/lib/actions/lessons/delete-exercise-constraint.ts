"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { exerciseConstraint } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function deleteExerciseConstraint(id: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.exerciseConstraint.findFirst({
    where: eq(exerciseConstraint.id, id),
    with: { exercise: { with: { lesson: { columns: { createdBy: true } } } } },
  });

  if (!existing || existing.exercise.lesson.createdBy !== currentUser.id) {
    throw new Error("Constraint not found.");
  }

  await db.delete(exerciseConstraint).where(eq(exerciseConstraint.id, id));
}
