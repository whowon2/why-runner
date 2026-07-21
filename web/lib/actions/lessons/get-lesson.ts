"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getLesson(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, lessonId),
    with: {
      problem: true,
    },
  });

  if (!found) throw new Error("Lesson not found");

  const completion = await db.query.lessonCompletion.findFirst({
    where: (c, { and, eq }) =>
      and(eq(c.userId, currentUser.id), eq(c.lessonId, lessonId)),
  });

  return { ...found, completed: !!completion };
}
