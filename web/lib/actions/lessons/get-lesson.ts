"use server";

import { db } from "@/drizzle/db";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getLesson(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const lesson = await db.query.lesson.findFirst({
    where: (l, { eq }) => eq(l.id, lessonId),
  });
  if (!lesson) throw new Error("Lesson not found");

  const classroom = await assertClassMember(lesson.classroomId, currentUser.id);
  const isOwner = classroom.createdBy === currentUser.id;
  if (!lesson.isPublished && !isOwner) throw new Error("Lesson not found");

  const [exercises, passedSubmissions, lessonSubmission] = await Promise.all([
    db.query.exercise.findMany({
      where: (exercise, { eq }) => eq(exercise.lessonId, lessonId),
      orderBy: (exercise, { asc }) => [asc(exercise.order)],
      with: {
        problem: { columns: { inputs: false, outputs: false } },
      },
    }),
    db.query.submission.findMany({
      where: (submission, { and, eq }) =>
        and(
          eq(submission.userId, currentUser.id),
          eq(submission.status, "PASSED"),
        ),
      columns: { problemId: true },
    }),
    db.query.lessonSubmission.findFirst({
      where: (s, { and, eq }) =>
        and(eq(s.userId, currentUser.id), eq(s.lessonId, lessonId)),
    }),
  ]);

  const passedProblemIds = new Set(passedSubmissions.map((s) => s.problemId));

  return {
    lesson,
    classroom,
    isOwner,
    submittedAt: lessonSubmission?.submittedAt ?? null,
    exercises: exercises.map((e) => ({
      ...e,
      done: passedProblemIds.has(e.problemId),
    })),
  };
}
