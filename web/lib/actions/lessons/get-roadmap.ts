"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getRoadmap() {
  const currentUser = await getCurrentUser({});

  const [lessons, completions] = await Promise.all([
    db.query.lesson.findMany({
      orderBy: (lesson, { asc }) => [asc(lesson.theme), asc(lesson.order)],
      with: {
        problem: {
          columns: { inputs: false, outputs: false },
        },
      },
    }),
    db.query.lessonCompletion.findMany({
      where: (completion, { eq }) => eq(completion.userId, currentUser.id),
    }),
  ]);

  const completedLessonIds = new Set(completions.map((c) => c.lessonId));

  const byTheme = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const group = byTheme.get(l.theme) ?? [];
    group.push(l);
    byTheme.set(l.theme, group);
  }

  return Array.from(byTheme.entries()).map(([theme, themeLessons]) => ({
    theme,
    lessons: themeLessons.map((l) => ({
      ...l,
      completed: completedLessonIds.has(l.id),
    })),
  }));
}
