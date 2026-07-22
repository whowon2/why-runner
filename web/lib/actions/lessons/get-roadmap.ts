"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { UnmetRequirement } from "@/lib/actions/lessons/lesson-lock";

export async function getRoadmap() {
  const currentUser = await getCurrentUser({});

  const [lessons, completions, themeSkills, languageSkills] = await Promise.all(
    [
      db.query.lesson.findMany({
        orderBy: (lesson, { asc }) => [asc(lesson.order)],
        with: {
          problem: {
            columns: { inputs: false, outputs: false },
          },
          themes: true,
          themeRequirements: true,
          languageRequirements: true,
        },
      }),
      db.query.lessonCompletion.findMany({
        where: (completion, { eq }) => eq(completion.userId, currentUser.id),
      }),
      db.query.userThemeSkill.findMany({
        where: (skill, { eq }) => eq(skill.userId, currentUser.id),
      }),
      db.query.userLanguageSkill.findMany({
        where: (skill, { eq }) => eq(skill.userId, currentUser.id),
      }),
    ],
  );

  const completedLessonIds = new Set(completions.map((c) => c.lessonId));
  const themeValues = new Map(themeSkills.map((s) => [s.theme, s.value]));
  const languageValues = new Map(
    languageSkills.map((s) => [s.language, s.value]),
  );

  const lessonsWithLock = lessons.map((l) => {
    const unmetRequirements: UnmetRequirement[] = [];

    for (const req of l.themeRequirements) {
      const currentValue = themeValues.get(req.theme) ?? 0;
      if (currentValue < req.minValue) {
        unmetRequirements.push({
          kind: "theme",
          theme: req.theme,
          minValue: req.minValue,
          currentValue,
        });
      }
    }

    for (const req of l.languageRequirements) {
      const currentValue = languageValues.get(req.language) ?? 0;
      if (currentValue < req.minValue) {
        unmetRequirements.push({
          kind: "language",
          language: req.language,
          minValue: req.minValue,
          currentValue,
        });
      }
    }

    return {
      ...l,
      completed: completedLessonIds.has(l.id),
      locked: unmetRequirements.length > 0,
      unmetRequirements,
      rewards: {
        themes: l.themes.map((t) => t.theme),
      },
    };
  });

  const byTheme = new Map<string, typeof lessonsWithLock>();
  for (const l of lessonsWithLock) {
    for (const { theme } of l.themes) {
      const group = byTheme.get(theme) ?? [];
      group.push(l);
      byTheme.set(theme, group);
    }
  }

  return Array.from(byTheme.entries()).map(([theme, themeLessons]) => ({
    theme,
    lessons: themeLessons,
  }));
}
