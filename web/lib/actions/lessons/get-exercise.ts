"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";

export async function getExercise(exerciseId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: (exercise, { eq }) => eq(exercise.id, exerciseId),
    with: {
      problem: true,
      lesson: { with: { classroom: true } },
    },
  });

  if (!found) throw new Error("Exercise not found");
  await assertClassMember(found.lesson.classroomId, currentUser.id);

  const [passed, lessonSubmission] = await Promise.all([
    db.query.submission.findFirst({
      // Scoped by exerciseId, not problemId: the same problem can back more
      // than one exercise (across lessons), so a pass on one exercise must
      // not mark every other exercise using that problem as done too.
      where: (submission, { and, eq }) =>
        and(
          eq(submission.userId, currentUser.id),
          eq(submission.exerciseId, exerciseId),
          eq(submission.status, "PASSED"),
        ),
    }),
    db.query.lessonSubmission.findFirst({
      where: (s, { and, eq }) =>
        and(eq(s.userId, currentUser.id), eq(s.lessonId, found.lessonId)),
    }),
  ]);

  const dueDatePassed = !!(
    found.lesson.dueDate && found.lesson.dueDate < new Date()
  );

  return {
    ...found,
    done: !!passed,
    lessonSubmitted: !!lessonSubmission,
    // Students may resubmit freely before the due date — only a passed due
    // date locks the editor (see `createExerciseSubmission`, which enforces
    // this same rule server-side).
    submissionsLocked: dueDatePassed,
  };
}

export async function getNextExercise(exerciseId: string) {
  const current = await db.query.exercise.findFirst({
    where: (exercise, { eq }) => eq(exercise.id, exerciseId),
  });
  if (!current) return null;

  const next = await db.query.exercise.findFirst({
    where: (exercise, { gt, and, eq, or }) =>
      and(
        eq(exercise.lessonId, current.lessonId),
        or(
          gt(exercise.order, current.order),
          and(eq(exercise.order, current.order), gt(exercise.id, current.id)),
        ),
      ),
    orderBy: (exercise, { asc }) => [asc(exercise.order), asc(exercise.id)],
    with: { problem: { columns: { id: true, title: true } } },
  });

  return next ?? null;
}

export async function getPreviousExercise(exerciseId: string) {
  const current = await db.query.exercise.findFirst({
    where: (exercise, { eq }) => eq(exercise.id, exerciseId),
  });
  if (!current) return null;

  const previous = await db.query.exercise.findFirst({
    where: (exercise, { lt, and, eq, or }) =>
      and(
        eq(exercise.lessonId, current.lessonId),
        or(
          lt(exercise.order, current.order),
          and(eq(exercise.order, current.order), lt(exercise.id, current.id)),
        ),
      ),
    orderBy: (exercise, { desc }) => [desc(exercise.order), desc(exercise.id)],
    with: { problem: { columns: { id: true, title: true } } },
  });

  return previous ?? null;
}
