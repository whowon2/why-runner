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
      // Scoped by exerciseId, not problemId: the same problem can back more
      // than one exercise (across lessons), so a pass on one exercise must
      // not mark every other exercise using that problem as done too.
      where: (submission, { and, eq, isNotNull }) =>
        and(
          eq(submission.userId, currentUser.id),
          eq(submission.status, "PASSED"),
          isNotNull(submission.exerciseId),
        ),
      columns: { exerciseId: true },
    }),
    db.query.lessonSubmission.findFirst({
      where: (s, { and, eq }) =>
        and(eq(s.userId, currentUser.id), eq(s.lessonId, lessonId)),
    }),
  ]);

  const passedExerciseIds = new Set(
    passedSubmissions.map((s) => s.exerciseId),
  );

  return {
    lesson,
    classroom,
    isOwner,
    submittedAt: lessonSubmission?.submittedAt ?? null,
    exercises: exercises.map((e) => ({
      ...e,
      done: passedExerciseIds.has(e.id),
    })),
  };
}
