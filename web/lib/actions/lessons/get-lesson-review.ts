"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroomMembership, lesson } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Professor-only: every class member's whole-lesson submission, exercise by exercise. */
export async function getLessonReview(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
    with: { classroom: { columns: { slug: true } } },
  });
  if (!found) throw new Error("Lesson not found");
  if (found.createdBy !== currentUser.id)
    throw new Error("Not the lesson owner");
  // Professor can only review after the due date — while it's still open,
  // students may keep resubmitting, so any earlier "review" would just be a
  // snapshot of in-progress work. No due date set means review is always
  // open (matches the field's optional, non-blocking default elsewhere).
  if (found.dueDate && found.dueDate > new Date()) {
    throw new Error("REVIEW_NOT_YET_AVAILABLE");
  }

  const [exercises, members, lessonSubmissions] = await Promise.all([
    db.query.exercise.findMany({
      where: (exercise, { eq }) => eq(exercise.lessonId, lessonId),
      orderBy: (exercise, { asc }) => [asc(exercise.order)],
      with: {
        problem: { columns: { id: true, title: true } },
        completions: {
          with: { user: true, submission: true },
        },
      },
    }),
    db.query.classroomMembership.findMany({
      where: eq(classroomMembership.classroomId, found.classroomId),
      with: { user: true },
    }),
    db.query.lessonSubmission.findMany({
      where: (s, { eq }) => eq(s.lessonId, lessonId),
    }),
  ]);

  const students = members
    .filter((m) => m.userId !== found.createdBy)
    .map((m) => m.user);

  const submissionByUser = new Map(
    lessonSubmissions.map((s) => [s.userId, s]),
  );

  return {
    lesson: found,
    students: students.map((student) => ({
      student,
      submittedAt: submissionByUser.get(student.id)?.submittedAt ?? null,
      reviewedAt: submissionByUser.get(student.id)?.reviewedAt ?? null,
      score: submissionByUser.get(student.id)?.score ?? null,
      answers: exercises.map((e) => {
        const completion = e.completions.find(
          (c) => c.userId === student.id,
        );
        return {
          exerciseId: e.id,
          problem: e.problem,
          submission: completion?.submission ?? null,
        };
      }),
    })),
  };
}
