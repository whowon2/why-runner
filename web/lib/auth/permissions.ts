import "server-only";

import { and, eq, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { cache } from "react";
import { db } from "@/drizzle/db";
import {
  classroom,
  classroomMembership,
  exercise,
  lesson,
  user,
} from "@/drizzle/schema";
import {
  type ClassRole,
  canManageClass,
  isClassOwner,
  resolveClassRole,
} from "@/lib/class-roles";

/**
 * Every "who may do what" check for classes, lessons, contests and problems.
 * Server-only, no auth of its own: callers pass the already-authenticated
 * user's id. Roles are read from the DB per request, never from the session
 * cookie (cached for minutes, so a demotion would lag).
 */

export const isAdmin = cache(async (userId: string): Promise<boolean> => {
  const found = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true },
  });
  return found?.role === "admin";
});

/** Throws unless the user is a platform admin. Every admin action calls it. */
export async function assertAdmin(userId: string) {
  if (!(await isAdmin(userId))) throw new Error("Forbidden");
}

// --- Classes and lessons ---------------------------------------------------

export async function getClassAccess(classroomId: string, userId: string) {
  const found = await db.query.classroom.findFirst({
    where: eq(classroom.id, classroomId),
  });
  if (!found) throw new Error("Class not found");

  const [membership, admin] = await Promise.all([
    db.query.classroomMembership.findFirst({
      where: and(
        eq(classroomMembership.classroomId, classroomId),
        eq(classroomMembership.userId, userId),
      ),
      columns: { role: true },
    }),
    isAdmin(userId),
  ]);

  const role: ClassRole | null = resolveClassRole({
    userId,
    createdBy: found.createdBy,
    membershipRole: membership?.role ?? null,
    admin,
  });

  return {
    classroom: found,
    role,
    canManage: canManageClass(role),
    isOwner: isClassOwner(role),
  };
}

export type ClassAccess = Awaited<ReturnType<typeof getClassAccess>>;

/** Throws unless the user has any relation to the class (incl. admin). */
export async function assertClassMember(classroomId: string, userId: string) {
  const access = await getClassAccess(classroomId, userId);
  if (!access.role) throw new Error("Not a member of this class");
  return access;
}

/** Owner, co-teacher or admin. */
export async function assertCanManageClass(
  classroomId: string,
  userId: string,
) {
  const access = await getClassAccess(classroomId, userId);
  if (!access.canManage) throw new Error("Forbidden");
  return access;
}

/** Owner-level (owner or admin): delete the class, manage co-teachers. */
export async function assertClassOwner(classroomId: string, userId: string) {
  const access = await getClassAccess(classroomId, userId);
  if (!access.isOwner) throw new Error("Forbidden");
  return access;
}

/** The owner plus every co-teacher: never counted as students. */
export async function classStaffIds(classroom: {
  id: string;
  createdBy: string;
}): Promise<string[]> {
  const teachers = await db.query.classroomMembership.findMany({
    where: and(
      eq(classroomMembership.classroomId, classroom.id),
      eq(classroomMembership.role, "teacher"),
    ),
    columns: { userId: true },
  });
  return [classroom.createdBy, ...teachers.map((t) => t.userId)];
}

/** Lessons are managed through their class, not by `lesson.createdBy`. */
export async function assertCanManageLesson(lessonId: string, userId: string) {
  const found = await db.query.lesson.findFirst({
    where: eq(lesson.id, lessonId),
  });
  if (!found) throw new Error("Lesson not found");
  const access = await assertCanManageClass(found.classroomId, userId);
  return { ...access, lesson: found };
}

export async function assertCanManageExercise(
  exerciseId: string,
  userId: string,
) {
  const found = await db.query.exercise.findFirst({
    where: eq(exercise.id, exerciseId),
    with: { lesson: true },
  });
  if (!found) throw new Error("Exercise not found");
  const access = await assertCanManageClass(found.lesson.classroomId, userId);
  return { ...access, exercise: found };
}

// --- Contests and problems -------------------------------------------------

/** Creator or admin. Lifecycle rules (start date, status) are the caller's. */
export async function canManageOwned(
  owned: { createdBy: string },
  userId: string,
): Promise<boolean> {
  return owned.createdBy === userId || isAdmin(userId);
}

export const canManageContest = canManageOwned;
export const canManageProblem = canManageOwned;

/**
 * Who sees every test of a lesson exercise (the "Test cases" card and the
 * judge report): the problem's author, class managers and admins.
 */
export async function canSeeAllExerciseTests(
  found: { problem: { createdBy: string }; lesson: { classroomId: string } },
  userId: string,
): Promise<boolean> {
  return (
    (await canManageProblem(found.problem, userId)) ||
    (await getClassAccess(found.lesson.classroomId, userId)).canManage
  );
}

/**
 * SQL ownership filter: `column = userId` for regular users, nothing for
 * admins (drizzle's `and` drops `undefined`).
 */
export async function ownerOrAdminFilter(
  column: AnyPgColumn,
  userId: string,
): Promise<SQL | undefined> {
  return (await isAdmin(userId)) ? undefined : eq(column, userId);
}
