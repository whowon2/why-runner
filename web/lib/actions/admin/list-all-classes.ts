"use server";

import { and, count, desc, eq, ilike, ne, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { classroom, classroomMembership, lesson, user } from "@/drizzle/schema";
import { type AdminListParams, adminListSchema } from "@/lib/admin/list-params";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertAdmin } from "@/lib/auth/permissions";

/** Admin only: every class with its owner, student count and lesson count. */
export async function listAllClasses(params: AdminListParams) {
  const currentUser = await getCurrentUser({});
  await assertAdmin(currentUser.id);
  const { page, pageSize, search } = adminListSchema.parse(params);

  const where = search ? ilike(classroom.name, `%${search}%`) : undefined;

  // Students only, same rule as `getClass` (`isClassStudent`).
  const studentCount = db
    .select({ value: count() })
    .from(classroomMembership)
    .where(
      and(
        eq(classroomMembership.classroomId, classroom.id),
        eq(classroomMembership.role, "student"),
        ne(classroomMembership.userId, classroom.createdBy),
      ),
    );
  const lessonCount = db
    .select({ value: count() })
    .from(lesson)
    .where(eq(lesson.classroomId, classroom.id));

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: classroom.id,
        name: classroom.name,
        slug: classroom.slug,
        createdAt: classroom.createdAt,
        owner: { name: user.name, username: user.username },
        studentCount: sql<number>`(${studentCount})`.mapWith(Number),
        lessonCount: sql<number>`(${lessonCount})`.mapWith(Number),
      })
      .from(classroom)
      .leftJoin(user, eq(user.id, classroom.createdBy))
      .where(where)
      .orderBy(desc(classroom.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(classroom).where(where),
  ]);

  return { data, total };
}
