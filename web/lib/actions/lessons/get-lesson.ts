"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUnmetRequirements } from "@/lib/actions/lessons/lesson-lock";

export async function getLesson(lessonId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, lessonId),
    with: {
      problem: true,
      themes: true,
      themeRequirements: true,
      languageRequirements: true,
    },
  });

  if (!found) throw new Error("Lesson not found");

  const [completion, unmetRequirements] = await Promise.all([
    db.query.lessonCompletion.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.userId, currentUser.id), eq(c.lessonId, lessonId)),
    }),
    getUnmetRequirements({
      userId: currentUser.id,
      themeRequirements: found.themeRequirements,
      languageRequirements: found.languageRequirements,
    }),
  ]);

  return {
    ...found,
    completed: !!completion,
    locked: unmetRequirements.length > 0,
    unmetRequirements,
    rewards: { themes: found.themes.map((t) => t.theme) },
  };
}
