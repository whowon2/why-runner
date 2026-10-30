"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type CreateExerciseInput, exercise, problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  assertCanManageExercise,
  assertCanManageLesson,
} from "@/lib/auth/permissions";
import { generateSlug } from "@/lib/slug";

export async function createExercise(
  // Answer mode is set afterwards via `setExerciseMode`, which enforces the
  // per-mode rules (e.g. a Parsons solution must pass the test cases first).
  input: Omit<CreateExerciseInput, "slug" | "mode" | "parsonsSolution">,
) {
  const currentUser = await getCurrentUser({});

  await assertCanManageLesson(input.lessonId, currentUser.id);

  const linkedProblem = await db.query.problem.findFirst({
    where: eq(problem.id, input.problemId),
    columns: { title: true, status: true, createdBy: true },
  });
  // Same visibility as the picker (`getProblems`): published problems plus
  // the teacher's own drafts — never someone else's draft.
  if (
    !linkedProblem ||
    (linkedProblem.status !== "published" &&
      linkedProblem.createdBy !== currentUser.id)
  ) {
    throw new Error("Problem not found");
  }

  const existing = await db.query.exercise.findFirst({
    where: and(
      eq(exercise.lessonId, input.lessonId),
      eq(exercise.problemId, input.problemId),
    ),
    columns: { id: true },
  });
  if (existing) {
    throw new Error("This problem is already an exercise in this lesson.");
  }

  let order = input.order;
  if (order === undefined) {
    const [{ value }] = await db
      .select({ value: max(exercise.order) })
      .from(exercise)
      .where(eq(exercise.lessonId, input.lessonId));
    order = value === null ? 0 : value + 1;
  }

  const [created] = await db
    .insert(exercise)
    .values({
      lessonId: input.lessonId,
      problemId: input.problemId,
      primaryLanguage: input.primaryLanguage,
      order,
      slug: generateSlug(linkedProblem.title),
    })
    .returning();
  return created;
}

export async function moveExerciseEntry(input: {
  exerciseId: string;
  direction: "up" | "down";
}) {
  const currentUser = await getCurrentUser({});

  const { exercise: found } = await assertCanManageExercise(
    input.exerciseId,
    currentUser.id,
  );

  await db.transaction(async (tx) => {
    const siblings = await tx.query.exercise.findMany({
      where: eq(exercise.lessonId, found.lessonId),
      orderBy: [asc(exercise.order), asc(exercise.createdAt)],
      columns: { id: true, order: true },
    });

    const index = siblings.findIndex((e) => e.id === input.exerciseId);
    const neighbour = input.direction === "up" ? index - 1 : index + 1;
    if (neighbour < 0 || neighbour >= siblings.length) return;

    // Legacy rows can share `order` (default 0), so normalize to 0..n-1
    // before swapping — otherwise swapping two equal values is a no-op.
    const orders = siblings.map((_, i) => i);
    [orders[index], orders[neighbour]] = [orders[neighbour], orders[index]];

    for (const [i, sibling] of siblings.entries()) {
      if (sibling.order === orders[i]) continue;
      await tx
        .update(exercise)
        .set({ order: orders[i] })
        .where(eq(exercise.id, sibling.id));
    }
  });
}

export async function deleteExerciseEntry(exerciseId: string) {
  const currentUser = await getCurrentUser({});

  const { exercise: found } = await assertCanManageExercise(
    exerciseId,
    currentUser.id,
  );
  // Deleting cascades students' exercise_completion rows (answers and
  // feedback), so only drafts may lose exercises — same rule as deleteLesson.
  if (found.lesson.isPublished) {
    throw new Error("Unpublish this assignment before removing exercises.");
  }

  await db.delete(exercise).where(eq(exercise.id, exerciseId));
}
