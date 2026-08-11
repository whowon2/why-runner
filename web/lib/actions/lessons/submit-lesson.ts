"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  exercise,
  exerciseCompletion,
  lessonSubmission,
  submission,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Student submits the whole lesson at once: for every exercise in the
 * lesson, snapshot their most recent submission (if any) to that exercise's
 * problem, then record the lesson-level submission timestamp.
 */
export async function submitLesson(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const lesson = await db.query.lesson.findFirst({
    where: (l, { eq }) => eq(l.id, lessonId),
    columns: { dueDate: true },
  });
  if (!lesson) throw new Error("Lesson not found");
  if (lesson.dueDate && lesson.dueDate < new Date()) {
    throw new Error("This lesson's due date has passed.");
  }

  const exercises = await db.query.exercise.findMany({
    where: eq(exercise.lessonId, lessonId),
  });
  if (exercises.length === 0)
    throw new Error("This lesson has no exercises yet");

  await db.transaction(async (tx) => {
    for (const e of exercises) {
      const latest = await tx.query.submission.findFirst({
        where: and(
          eq(submission.problemId, e.problemId),
          eq(submission.userId, currentUser.id),
        ),
        orderBy: desc(submission.createdAt),
      });

      await tx
        .insert(exerciseCompletion)
        .values({
          userId: currentUser.id,
          exerciseId: e.id,
          submissionId: latest?.id ?? null,
          language: latest?.language ?? null,
        })
        .onConflictDoUpdate({
          target: [exerciseCompletion.userId, exerciseCompletion.exerciseId],
          set: {
            submissionId: latest?.id ?? null,
            language: latest?.language ?? null,
            completedAt: new Date(),
          },
        });
    }

    await tx
      .insert(lessonSubmission)
      .values({ userId: currentUser.id, lessonId })
      .onConflictDoUpdate({
        target: [lessonSubmission.userId, lessonSubmission.lessonId],
        set: { submittedAt: new Date() },
      });
  });

  return { submittedAt: new Date() };
}
