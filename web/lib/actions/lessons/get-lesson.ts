"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getRequirementsStatus } from "@/lib/actions/lessons/lesson-lock";

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

  const [completion, requirements] = await Promise.all([
    db.query.lessonCompletion.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.userId, currentUser.id), eq(c.lessonId, lessonId)),
    }),
    getRequirementsStatus({
      userId: currentUser.id,
      themeRequirements: found.themeRequirements,
      languageRequirements: found.languageRequirements,
    }),
  ]);

  const unmetRequirements = requirements.filter((r) => !r.met);

  return {
    ...found,
    completed: !!completion,
    locked: unmetRequirements.length > 0,
    requirements,
    unmetRequirements,
    rewards: { themes: found.themes.map((t) => t.theme) },
  };
}

export async function getNextLesson(lessonId: string) {
  const current = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, lessonId),
  });

  if (!current) return null;

  const next = await db.query.lesson.findFirst({
    where: (lesson, { gt, and, eq, or }) =>
      or(
        gt(lesson.order, current.order),
        and(eq(lesson.order, current.order), gt(lesson.id, current.id)),
      ),
    orderBy: (lesson, { asc }) => [asc(lesson.order), asc(lesson.id)],
    with: { problem: { columns: { id: true, title: true } } },
  });

  return next ?? null;
}
