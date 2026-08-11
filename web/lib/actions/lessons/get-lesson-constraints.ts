"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type ProblemConstraint, lessonConstraint } from "@/drizzle/schema";
import { assertClassMember } from "@/lib/actions/classes/assert-class-member";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// Read access is any class member (students need to see what's expected of
// them before/after submitting), not just the track owner — mutations
// (create/update/delete/upsert) stay owner-gated in their own actions.
export async function getLessonConstraints(
  lessonId: string,
): Promise<ProblemConstraint[]> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: (l, { eq }) => eq(l.id, lessonId),
    with: { track: { columns: { classroomId: true } } },
  });

  if (!found) throw new Error("Lesson not found.");
  await assertClassMember(found.track.classroomId, currentUser.id);

  return db.query.lessonConstraint.findMany({
    where: eq(lessonConstraint.lessonId, lessonId),
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  });
}
