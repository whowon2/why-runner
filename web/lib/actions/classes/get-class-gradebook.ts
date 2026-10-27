"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  classroomMembership,
  exerciseCompletion,
  lesson,
  lessonSubmission,
} from "@/drizzle/schema";
import { ok } from "@/lib/action-result";
import { assertClassOwner } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { buildGradebook } from "@/lib/gradebook";

/**
 * Owner-only: every student × every published lesson exercise, scored like
 * lesson review. Only numbers leave the server, never `submission.output`.
 */
export async function getClassGradebook(classroomId: string) {
  const id = z.uuid().parse(classroomId);
  const currentUser = await getCurrentUser({});
  const classroom = await assertClassOwner(id, currentUser.id);

  const [lessons, members] = await Promise.all([
    db.query.lesson.findMany({
      where: and(eq(lesson.classroomId, id), eq(lesson.isPublished, true)),
      orderBy: (l, { asc }) => [asc(l.createdAt)],
      columns: { id: true, title: true, slug: true, dueDate: true },
      with: {
        exercises: {
          orderBy: (e, { asc }) => [asc(e.order)],
          columns: { id: true },
          with: { problem: { columns: { title: true } } },
        },
      },
    }),
    db.query.classroomMembership.findMany({
      where: eq(classroomMembership.classroomId, id),
      with: {
        user: {
          columns: { id: true, name: true, username: true, image: true },
        },
      },
    }),
  ]);

  // The owner isn't a student even with a membership row (see `getClass`).
  const students = members
    .filter((m) => m.userId !== classroom.createdBy)
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
            columns: { userId: true, lessonId: true },
          }),
          exerciseIds.length
            ? db.query.exerciseCompletion.findMany({
                where: and(
                  inArray(exerciseCompletion.exerciseId, exerciseIds),
                  inArray(exerciseCompletion.userId, studentIds),
                ),
                columns: { userId: true, exerciseId: true },
                with: { submission: { columns: { output: true } } },
              })
            : [],
        ])
      : [[], []];

  return ok({
    classroom: { id: classroom.id, name: classroom.name, slug: classroom.slug },
    ...buildGradebook({
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        dueDate: l.dueDate,
        exercises: l.exercises.map((e) => ({
          id: e.id,
          problemTitle: e.problem.title,
        })),
      })),
      students,
      lessonSubmissions,
      completions: completions.map((c) => ({
        userId: c.userId,
        exerciseId: c.exerciseId,
        output: c.submission?.output ?? null,
      })),
    }),
  });
}
