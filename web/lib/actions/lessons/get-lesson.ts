"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";

export async function getLesson(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, lessonId),
    with: {
      problem: true,
      track: { with: { classroom: true } },
    },
  });

  if (!found) throw new Error("Lesson not found");
  await assertClassMember(found.track.classroomId, currentUser.id);

  const [passed, trackSubmission] = await Promise.all([
    db.query.submission.findFirst({
      where: (submission, { and, eq }) =>
        and(
          eq(submission.userId, currentUser.id),
          eq(submission.problemId, found.problemId),
          eq(submission.status, "PASSED"),
        ),
    }),
    db.query.lessonTrackSubmission.findFirst({
      where: (s, { and, eq }) =>
        and(eq(s.userId, currentUser.id), eq(s.trackId, found.trackId)),
    }),
  ]);

  const dueDatePassed = !!(
    found.track.dueDate && found.track.dueDate < new Date()
  );

  return {
    ...found,
    done: !!passed,
    trackSubmitted: !!trackSubmission,
    // Students may resubmit freely before the due date — only a passed due
    // date locks the editor (see `createLessonSubmission`, which enforces
    // this same rule server-side).
    submissionsLocked: dueDatePassed,
  };
}

export async function getNextLesson(lessonId: string) {
  const current = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, lessonId),
  });
  if (!current) return null;

  const next = await db.query.lesson.findFirst({
    where: (lesson, { gt, and, eq, or }) =>
      and(
        eq(lesson.trackId, current.trackId),
        or(
          gt(lesson.order, current.order),
          and(eq(lesson.order, current.order), gt(lesson.id, current.id)),
        ),
      ),
    orderBy: (lesson, { asc }) => [asc(lesson.order), asc(lesson.id)],
    with: { problem: { columns: { id: true, title: true } } },
  });

  return next ?? null;
}

export async function getPreviousLesson(lessonId: string) {
  const current = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, lessonId),
  });
  if (!current) return null;

  const previous = await db.query.lesson.findFirst({
    where: (lesson, { lt, and, eq, or }) =>
      and(
        eq(lesson.trackId, current.trackId),
        or(
          lt(lesson.order, current.order),
          and(eq(lesson.order, current.order), lt(lesson.id, current.id)),
        ),
      ),
    orderBy: (lesson, { desc }) => [desc(lesson.order), desc(lesson.id)],
    with: { problem: { columns: { id: true, title: true } } },
  });

  return previous ?? null;
}
