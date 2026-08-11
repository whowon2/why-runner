"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type ProblemConstraint, exerciseConstraint } from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// Read access is any class member (students need to see what's expected of
// them before/after submitting), not just the lesson owner — mutations
// (create/update/delete/upsert) stay owner-gated in their own actions.
export async function getExerciseConstraints(
  exerciseId: string,
): Promise<ProblemConstraint[]> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.id, exerciseId),
    with: { lesson: { columns: { classroomId: true } } },
  });

  if (!found) throw new Error("Exercise not found.");
  await assertClassMember(found.lesson.classroomId, currentUser.id);

  return db.query.exerciseConstraint.findMany({
    where: eq(exerciseConstraint.exerciseId, exerciseId),
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  });
}
