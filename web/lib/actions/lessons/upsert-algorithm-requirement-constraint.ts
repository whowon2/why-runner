"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { exerciseConstraint } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// Only one algorithm-requirement constraint is allowed per exercise (see
// `exercise_constraint_one_algo_requirement` partial unique index). This
// action always upserts the single row rather than inserting a second one,
// so "add" and "edit" are the same operation from the UI's point of view.
export async function upsertAlgorithmRequirementConstraint(input: {
  exerciseId: string;
  description: string;
}) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.id, input.exerciseId),
    with: { lesson: { columns: { createdBy: true } } },
  });

  if (!owned || owned.lesson.createdBy !== currentUser.id) {
    throw new Error("Exercise not found.");
  }

  const description = input.description.trim();
  if (!description) {
    throw new Error("Algorithm requirement description cannot be empty.");
  }

  const existing = await db.query.exerciseConstraint.findFirst({
    where: and(
      eq(exerciseConstraint.exerciseId, input.exerciseId),
      eq(exerciseConstraint.kind, "algorithm_requirement"),
    ),
    columns: { id: true },
  });

  if (existing) {
    const [updated] = await db
      .update(exerciseConstraint)
      .set({ description })
      .where(eq(exerciseConstraint.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(exerciseConstraint)
    .values({
      exerciseId: input.exerciseId,
      kind: "algorithm_requirement",
      description,
    })
    .returning();

  return created;
}
