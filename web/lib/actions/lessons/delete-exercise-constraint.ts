"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { exerciseConstraint } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageExercise } from "@/lib/auth/permissions";

export async function deleteExerciseConstraint(id: string) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.exerciseConstraint.findFirst({
    where: eq(exerciseConstraint.id, id),
    columns: { exerciseId: true },
  });
  if (!existing) throw new Error("Constraint not found.");
  await assertCanManageExercise(existing.exerciseId, currentUser.id);

  await db.delete(exerciseConstraint).where(eq(exerciseConstraint.id, id));
}
