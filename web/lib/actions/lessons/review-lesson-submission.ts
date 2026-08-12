"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lesson, lessonSubmission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Professor-only: grade one student's whole-lesson submission. Only
 * possible after the lesson's due date (same gate as `getLessonReview`). */
export async function reviewLessonSubmission(input: {
  lessonId: string;
  userId: string;
  score: number;
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
    where: and(
      eq(lessonSubmission.userId, input.userId),
      eq(lessonSubmission.lessonId, input.lessonId),
    ),
  });
  if (!existing) throw new Error("Student hasn't submitted this lesson.");

  const [updated] = await db
    .update(lessonSubmission)
    .set({ score: input.score, reviewedAt: new Date() })
    .where(
      and(
        eq(lessonSubmission.userId, input.userId),
        eq(lessonSubmission.lessonId, input.lessonId),
      ),
    )
    .returning();

  return updated;
}
