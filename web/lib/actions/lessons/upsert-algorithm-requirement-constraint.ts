"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lessonConstraint } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// Only one algorithm-requirement constraint is allowed per lesson (see
// `lesson_constraint_one_algo_requirement` partial unique index). This
// action always upserts the single row rather than inserting a second one,
// so "add" and "edit" are the same operation from the UI's point of view.
export async function upsertAlgorithmRequirementConstraint(input: {
  lessonId: string;
  description: string;
}) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.lesson.findFirst({
    where: (l, { eq }) => eq(l.id, input.lessonId),
    with: { track: { columns: { createdBy: true } } },
  });

  if (!owned || owned.track.createdBy !== currentUser.id) {
    throw new Error("Lesson not found.");
  }

  const description = input.description.trim();
  if (!description) {
    throw new Error("Algorithm requirement description cannot be empty.");
  }

  const existing = await db.query.lessonConstraint.findFirst({
    where: and(
      eq(lessonConstraint.lessonId, input.lessonId),
      eq(lessonConstraint.kind, "algorithm_requirement"),
    ),
    columns: { id: true },
  });

  if (existing) {
    const [updated] = await db
      .update(lessonConstraint)
      .set({ description })
      .where(eq(lessonConstraint.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(lessonConstraint)
    .values({
      lessonId: input.lessonId,
      kind: "algorithm_requirement",
      description,
    })
    .returning();

  return created;
}
