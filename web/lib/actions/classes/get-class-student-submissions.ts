"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  classroomMembership,
  exercise,
  lesson,
  problem,
  submission,
} from "@/drizzle/schema";
import { ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageClass } from "@/lib/auth/permissions";
import { isClassStudent } from "@/lib/class-roles";

const RECENT_LIMIT = 10;

const inputSchema = z.object({
  classroomId: z.uuid(),
  userId: z.string().min(1).max(255),
});

/**
 * Class managers only: one student's most recent submissions to this
 * class's lesson exercises (newest first, canceled ones left out), for the
 * roster's student panel. Only metadata leaves the server, never the
 * submitted code or `submission.output`.
 */
export async function getClassStudentSubmissions(
  classroomId: string,
  userId: string,
) {
  const input = inputSchema.parse({ classroomId, userId });
  const currentUser = await getCurrentUser({});
  const { classroom } = await assertCanManageClass(
    input.classroomId,
    currentUser.id,
  );

  const membership = await db.query.classroomMembership.findFirst({
    where: and(
      eq(classroomMembership.classroomId, classroom.id),
      eq(classroomMembership.userId, input.userId),
    ),
    columns: { userId: true, role: true },
  });
  if (!membership || !isClassStudent(membership, classroom.createdBy))
    throw new Error("Not a student of this class");

  const rows = await db
    .select({
      id: submission.id,
      status: submission.status,
      language: submission.language,
      createdAt: submission.createdAt,
      exerciseSlug: exercise.slug,
      problemTitle: problem.title,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
    })
    .from(submission)
    .innerJoin(exercise, eq(submission.exerciseId, exercise.id))
    .innerJoin(lesson, eq(exercise.lessonId, lesson.id))
    .innerJoin(problem, eq(exercise.problemId, problem.id))
    .where(
      and(
        eq(lesson.classroomId, classroom.id),
        eq(submission.userId, input.userId),
        ne(submission.status, "CANCELED"),
      ),
    )
    .orderBy(desc(submission.createdAt))
    .limit(RECENT_LIMIT);

  return ok(rows);
}

export type ClassStudentSubmission = Awaited<
  ReturnType<typeof getClassStudentSubmissions>
>["data"][number];
