"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  exercise,
  exerciseCompletion,
  lesson,
  lessonSubmission,
  submission,
} from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { computeExerciseScore } from "@/lib/exercise-score";

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
    columns: { id: true, lessonId: true },
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

  const exerciseIds = exercises.map((e) => e.id);
  // Scoped by exerciseId, not problemId: the same problem can back more
  // than one exercise (across lessons), so a pass on one exercise must not
  // count as a pass for every other exercise using that problem too.
  const [passedSubmissions, mySubmissions, myCompletions] = await Promise.all([
    exerciseIds.length
      ? db.query.submission.findMany({
          where: and(
            eq(submission.userId, currentUser.id),
            eq(submission.status, "PASSED"),
            inArray(submission.exerciseId, exerciseIds),
          ),
          columns: { exerciseId: true },
        })
      : [],
    db.query.lessonSubmission.findMany({
      where: and(
        eq(lessonSubmission.userId, currentUser.id),
        inArray(lessonSubmission.lessonId, lessonIds),
      ),
    }),
    // For the score sum below — mirrors `getLessonReview`'s derivation, just
    // scoped to the current student instead of every classroom member.
    exerciseIds.length
      ? db.query.exerciseCompletion.findMany({
          where: and(
            eq(exerciseCompletion.userId, currentUser.id),
            inArray(exerciseCompletion.exerciseId, exerciseIds),
          ),
          with: { submission: true },
        })
      : [],
  ]);

  const passedExerciseIds = new Set(
    passedSubmissions.map((s) => s.exerciseId),
  );
  const mySubmissionByLesson = new Map(
    mySubmissions.map((s) => [s.lessonId, s]),
  );
  const scoreByExercise = new Map(
    myCompletions.map((c) => [
      c.exerciseId,
      computeExerciseScore(c.submission?.output),
    ]),
  );

  return lessons.map((l) => {
    const lessonExercises = exercisesByLesson.get(l.id) ?? [];
    const completedCount = lessonExercises.filter((e) =>
      passedExerciseIds.has(e.id),
    ).length;
    const mySubmission = mySubmissionByLesson.get(l.id) ?? null;

    return {
      ...l,
      exerciseCount: lessonExercises.length,
      completedCount,
      mySubmission: mySubmission && {
        ...mySubmission,
        score: lessonExercises.reduce(
          (sum, e) => sum + (scoreByExercise.get(e.id) ?? 0),
          0,
        ),
      },
    };
  });
}
