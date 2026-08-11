"use server";

import { eq, max } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type CreateExerciseInput,
  exercise,
  lesson,
  problem,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSlug } from "@/lib/slug";

export async function createExercise(
  input: Omit<CreateExerciseInput, "slug">,
) {
  const currentUser = await getCurrentUser({});

  const linkedLesson = await db.query.lesson.findFirst({
    where: eq(lesson.id, input.lessonId),
  });
  if (!linkedLesson) throw new Error("Lesson not found");
  if (linkedLesson.createdBy !== currentUser.id)
    throw new Error("Not the lesson owner");

  const linkedProblem = await db.query.problem.findFirst({
    where: eq(problem.id, input.problemId),
    columns: { title: true },
  });
  if (!linkedProblem) throw new Error("Problem not found");

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
    .values({ ...input, order, slug: generateSlug(linkedProblem.title) })
    .returning();
  return created;
}

export async function reorderExerciseEntry(input: {
  exerciseId: string;
  order: number;
}) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: eq(exercise.id, input.exerciseId),
    with: { lesson: true },
  });
  if (!found) throw new Error("Exercise not found");
  if (found.lesson.createdBy !== currentUser.id) {
    throw new Error("Not the lesson owner");
  }

  const [updated] = await db
    .update(exercise)
    .set({ order: input.order })
    .where(eq(exercise.id, input.exerciseId))
    .returning();
  return updated;
}

export async function deleteExerciseEntry(exerciseId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: eq(exercise.id, exerciseId),
    with: { lesson: true },
  });
  if (!found) throw new Error("Exercise not found");
  if (found.lesson.createdBy !== currentUser.id) {
    throw new Error("Not the lesson owner");
  }

  await db.delete(exercise).where(eq(exercise.id, exerciseId));
}
