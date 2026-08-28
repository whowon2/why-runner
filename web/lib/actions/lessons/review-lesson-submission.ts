"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  exercise,
  exerciseCompletion,
  lesson,
  lessonSubmission,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Professor-only: mark a student's whole-lesson submission reviewed. Score
 * is never set here — it's always derived from judge results (see
 * `getLessonReview`). Only possible after the lesson's due date. */
export async function markLessonSubmissionReviewed(input: {
  lessonId: string;
  userId: string;
}) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: eq(lesson.id, input.lessonId),
  });
  if (!found) throw new Error("Lesson not found");
  if (found.createdBy !== currentUser.id)
    throw new Error("Not the lesson owner");
  if (found.dueDate && found.dueDate > new Date()) {
    throw new Error("Can't review before the due date.");
  }

  const existing = await db.query.lessonSubmission.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.userId, input.userId), eq(s.lessonId, input.lessonId)),
  });
  if (!existing) throw new Error("Student hasn't submitted this lesson.");

  const [updated] = await db
    .update(lessonSubmission)
    .set({ reviewedAt: new Date() })
    .where(
      and(
        eq(lessonSubmission.userId, input.userId),
        eq(lessonSubmission.lessonId, input.lessonId),
      ),
    )
    .returning();

  return updated;
}

/** Professor-only: attach free-text feedback to one student's answer to one
 * exercise within a submitted lesson. Independent of every other exercise's
 * feedback and of the lesson's overall reviewed state. Only possible after
 * the lesson's due date (same gate as `getLessonReview`). */
export async function setExerciseFeedback(input: {
  exerciseId: string;
  userId: string;
  feedback: string;
}) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: eq(exercise.id, input.exerciseId),
    with: { lesson: true },
  });
  if (!found) throw new Error("Exercise not found");
  if (found.lesson.createdBy !== currentUser.id)
    throw new Error("Not the lesson owner");
  if (found.lesson.dueDate && found.lesson.dueDate > new Date()) {
    throw new Error("Can't review before the due date.");
  }

  const [updated] = await db
    .update(exerciseCompletion)
    .set({ feedback: input.feedback })
    .where(
      and(
        eq(exerciseCompletion.userId, input.userId),
        eq(exerciseCompletion.exerciseId, input.exerciseId),
      ),
    )
    .returning();

  if (!updated) throw new Error("Student hasn't completed this exercise.");

  return updated;
}
