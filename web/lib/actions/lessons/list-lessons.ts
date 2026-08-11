"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { exercise, lesson, lessonSubmission, submission } from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** Lessons (assignments) in a class, for a member or the class owner. */
export async function listClassLessons(classroomId: string) {
  const currentUser = await getCurrentUser({});
  const classroom = await assertClassMember(classroomId, currentUser.id);
  const isOwner = classroom.createdBy === currentUser.id;

  const allLessons = await db.query.lesson.findMany({
    where: eq(lesson.classroomId, classroomId),
    orderBy: (l, { asc }) => [asc(l.createdAt)],
  });

  // Non-owners only see published (assigned) lessons.
  const lessons = isOwner
    ? allLessons
    : allLessons.filter((l) => l.isPublished);
  if (lessons.length === 0) return [];

  const lessonIds = lessons.map((l) => l.id);

  const exercises = await db.query.exercise.findMany({
    where: inArray(exercise.lessonId, lessonIds),
    columns: { id: true, lessonId: true, problemId: true },
  });
  const exercisesByLesson = new Map<string, typeof exercises>();
  for (const e of exercises) {
    exercisesByLesson.set(e.lessonId, [
      ...(exercisesByLesson.get(e.lessonId) ?? []),
      e,
    ]);
  }

  // Professors don't submit exercises — this per-user progress/submission
  // data is only meaningful (and only fetched) for the current student.
  if (isOwner) {
    return lessons.map((l) => ({
      ...l,
      exerciseCount: exercisesByLesson.get(l.id)?.length ?? 0,
      completedCount: null,
      mySubmission: null,
    }));
  }

  const problemIds = exercises.map((e) => e.problemId);
  const [passedSubmissions, mySubmissions] = await Promise.all([
    problemIds.length
      ? db.query.submission.findMany({
          where: and(
            eq(submission.userId, currentUser.id),
            eq(submission.status, "PASSED"),
            inArray(submission.problemId, problemIds),
          ),
          columns: { problemId: true },
        })
      : [],
    db.query.lessonSubmission.findMany({
      where: and(
        eq(lessonSubmission.userId, currentUser.id),
        inArray(lessonSubmission.lessonId, lessonIds),
      ),
    }),
  ]);

  const passedProblemIds = new Set(passedSubmissions.map((s) => s.problemId));
  const mySubmissionByLesson = new Map(
    mySubmissions.map((s) => [s.lessonId, s]),
  );

  return lessons.map((l) => {
    const lessonExercises = exercisesByLesson.get(l.id) ?? [];
    const completedCount = lessonExercises.filter((e) =>
      passedProblemIds.has(e.problemId),
    ).length;

    return {
      ...l,
      exerciseCount: lessonExercises.length,
      completedCount,
      mySubmission: mySubmissionByLesson.get(l.id) ?? null,
    };
  });
}
