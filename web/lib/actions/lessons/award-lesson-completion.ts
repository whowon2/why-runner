"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type Language,
  lesson,
  lessonCompletion,
  lessonTheme,
  userLanguageSkill,
  userThemeSkill,
} from "@/drizzle/schema";

/**
 * Called whenever a submission for a lesson-linked problem is observed as PASSED.
 * Awards theme + language skill on the user's first pass of that lesson; no-ops
 * (including on a unique-constraint race from concurrent passes) otherwise.
 */
export async function awardLessonCompletionIfFirstPass({
  userId,
  problemId,
  language,
}: {
  userId: string;
  problemId: string;
  language: Language | null;
}) {
  if (!language) return;

  const linkedLesson = await db.query.lesson.findFirst({
    where: eq(lesson.problemId, problemId),
  });
  if (!linkedLesson) return;

  await db.transaction(async (tx) => {
    const existing = await tx.query.lessonCompletion.findFirst({
      where: and(
        eq(lessonCompletion.userId, userId),
        eq(lessonCompletion.lessonId, linkedLesson.id),
      ),
    });
    if (existing) return;

    try {
      await tx.insert(lessonCompletion).values({
        userId,
        lessonId: linkedLesson.id,
        language,
      });
    } catch {
      // Unique-constraint race: another concurrent passing submission already
      // recorded the completion. Treat as already-completed, skip the award.
      return;
    }

    const themes = await tx.query.lessonTheme.findMany({
      where: eq(lessonTheme.lessonId, linkedLesson.id),
    });

    for (const { theme } of themes) {
      await tx
        .insert(userThemeSkill)
        .values({ userId, theme, value: 1 })
        .onConflictDoUpdate({
          target: [userThemeSkill.userId, userThemeSkill.theme],
          set: { value: sql`${userThemeSkill.value} + 1` },
        });
    }

    await tx
      .insert(userLanguageSkill)
      .values({ userId, language, value: 1 })
      .onConflictDoUpdate({
        target: [userLanguageSkill.userId, userLanguageSkill.language],
        set: { value: sql`${userLanguageSkill.value} + 1` },
      });
  });
}
