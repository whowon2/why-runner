import "server-only";

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  classroomMembership,
  exerciseCompletion,
  lesson,
  lessonSubmission,
  submission,
} from "@/drizzle/schema";
import { isClassStudent } from "@/lib/class-roles";

/**
 * Shared by the gradebook and the detailed results export so both cover the
 * same students (`student` members, never the owner or co-teachers) and the
 * same published exercises. No auth — callers must have checked that the
 * user manages the class. Completions carry the raw `submission.output`;
 * never return it to the client as is.
 */
export async function loadClassResultsData(classroom: {
  id: string;
  createdBy: string;
}) {
  const [lessons, members] = await Promise.all([
    db.query.lesson.findMany({
      where: and(
        eq(lesson.classroomId, classroom.id),
        eq(lesson.isPublished, true),
      ),
      orderBy: (l, { asc }) => [asc(l.createdAt)],
      columns: { id: true, title: true, slug: true, dueDate: true },
      with: {
        exercises: {
          orderBy: (e, { asc }) => [asc(e.order)],
          columns: { id: true },
          with: { problem: { columns: { code: true, title: true } } },
        },
      },
    }),
    db.query.classroomMembership.findMany({
      where: eq(classroomMembership.classroomId, classroom.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            ra: true,
            image: true,
          },
        },
      },
    }),
  ]);

  const students = members
    .filter((m) => isClassStudent(m, classroom.createdBy))
    .map((m) => m.user);
  const lessonIds = lessons.map((l) => l.id);
  const exerciseIds = lessons.flatMap((l) => l.exercises.map((e) => e.id));
  const studentIds = students.map((s) => s.id);

  const [lessonSubmissions, completions] =
    lessonIds.length && studentIds.length
      ? await Promise.all([
          db.query.lessonSubmission.findMany({
            where: and(
              inArray(lessonSubmission.lessonId, lessonIds),
              inArray(lessonSubmission.userId, studentIds),
            ),
            columns: {
              userId: true,
              lessonId: true,
              submittedAt: true,
              reviewedAt: true,
            },
          }),
          exerciseIds.length
            ? db.query.exerciseCompletion.findMany({
                where: and(
                  inArray(exerciseCompletion.exerciseId, exerciseIds),
                  inArray(exerciseCompletion.userId, studentIds),
                ),
                columns: { userId: true, exerciseId: true, feedback: true },
                with: {
                  submission: {
                    columns: {
                      status: true,
                      output: true,
                      language: true,
                      createdAt: true,
                    },
                  },
                },
              })
            : [],
        ])
      : [[], []];

  return {
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      dueDate: l.dueDate,
      exercises: l.exercises.map((e) => ({
        id: e.id,
        problemCode: e.problem.code,
        problemTitle: e.problem.title,
      })),
    })),
    students,
    lessonSubmissions,
    completions: completions.map((c) => ({
      userId: c.userId,
      exerciseId: c.exerciseId,
      feedback: c.feedback,
      submission: c.submission ?? null,
    })),
    exerciseIds,
    studentIds,
  };
}

/** Attempts, latest attempt and any pass per student × exercise. */
export async function loadClassActivity(
  exerciseIds: string[],
  studentIds: string[],
) {
  if (!exerciseIds.length || !studentIds.length) return [];

  return db
    .select({
      userId: submission.userId,
      exerciseId: sql<string>`${submission.exerciseId}`,
      attempts: count(),
      lastAttemptAt: sql<Date | null>`max(${submission.createdAt})`.mapWith(
        submission.createdAt,
      ),
      everPassed:
        sql<boolean>`bool_or(${submission.status} = 'PASSED')`.mapWith(Boolean),
    })
    .from(submission)
    .where(
      and(
        inArray(submission.exerciseId, exerciseIds),
        inArray(submission.userId, studentIds),
      ),
    )
    .groupBy(submission.userId, submission.exerciseId);
}
