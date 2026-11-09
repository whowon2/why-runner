"use server";

import { and, countDistinct, eq, inArray, ne, notInArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { classroomMembership, submission } from "@/drizzle/schema";
import { getProblemStatistics } from "@/lib/actions/problems/get-problem-statistics";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassMember, classStaffIds } from "@/lib/auth/permissions";

export type ExerciseStatistics = {
  /** `class`: this exercise's submissions by the class's students (managers only). */
  scope: "class" | "global";
  solvedByCount: number;
  attemptedByCount: number;
  successRate: number;
  /** Students in the class, `class` scope only. */
  studentCount: number | null;
};

/**
 * Statistics drawer of a lesson exercise. Class managers see how their class
 * does on this exercise (students only, staff never counted); everyone else
 * sees the problem-wide numbers of the problem page. The scope is decided
 * here, never by the client.
 */
export async function getExerciseStatistics(
  exerciseId: string,
): Promise<ExerciseStatistics> {
  const id = z.uuid().parse(exerciseId);
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.id, id),
    columns: { id: true, problemId: true },
    with: { lesson: { columns: { classroomId: true } } },
  });
  if (!found) throw new Error("Exercise not found");

  const access = await assertClassMember(
    found.lesson.classroomId,
    currentUser.id,
  );

  if (!access.canManage) {
    const stats = await getProblemStatistics(found.problemId);
    return {
      scope: "global",
      solvedByCount: stats.solvedByCount,
      attemptedByCount: stats.attemptedByCount,
      successRate: stats.successRate,
      studentCount: null,
    };
  }

  const staff = await classStaffIds(access.classroom);
  const isStudent = and(
    eq(classroomMembership.classroomId, access.classroom.id),
    eq(classroomMembership.role, "student"),
    notInArray(classroomMembership.userId, staff),
  );
  const students = db
    .select({ userId: classroomMembership.userId })
    .from(classroomMembership)
    .where(isStudent);

  const countUsers = (...where: Parameters<typeof and>) =>
    db
      .select({ count: countDistinct(submission.userId) })
      .from(submission)
      .where(
        and(
          eq(submission.exerciseId, found.id),
          inArray(submission.userId, students),
          ...where,
        ),
      );

  const [[solved], [attempted], studentCount] = await Promise.all([
    countUsers(eq(submission.status, "PASSED")),
    // Withdrawn before the judge ran it: not an attempt.
    countUsers(ne(submission.status, "CANCELED")),
    db.$count(classroomMembership, isStudent),
  ]);

  const solvedByCount = Number(solved?.count ?? 0);
  const attemptedByCount = Number(attempted?.count ?? 0);
  return {
    scope: "class",
    solvedByCount,
    attemptedByCount,
    successRate: attemptedByCount > 0 ? solvedByCount / attemptedByCount : 0,
    studentCount,
  };
}
