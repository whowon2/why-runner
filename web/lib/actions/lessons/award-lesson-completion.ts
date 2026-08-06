"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type Language,
  type LessonTheme,
  lesson,
  lessonCompletion,
  lessonLanguageRequirement,
  lessonTheme,
  lessonThemeRequirement,
  userLanguageSkill,
  userThemeSkill,
} from "@/drizzle/schema";
import { notifyLessonUnlocked } from "@/lib/notifications";

/**
 * Finds lessons that reference any of the just-updated themes/language and
 * whose requirements were unmet with the pre-increment skill values but are
 * now fully met with the post-increment values — i.e. lessons that just
 * transitioned from locked to unlocked for this user.
 */
async function notifyNewlyUnlockedLessons({
  userId,
  updatedThemes,
  updatedLanguage,
  excludeLessonId,
}: {
  userId: string;
  updatedThemes: LessonTheme[];
  updatedLanguage: Language;
  excludeLessonId: string;
}) {
  const [themeReqs, languageReqs] = await Promise.all([
    updatedThemes.length
      ? db.query.lessonThemeRequirement.findMany({
          where: inArray(lessonThemeRequirement.theme, updatedThemes),
        })
      : Promise.resolve([]),
    db.query.lessonLanguageRequirement.findMany({
      where: eq(lessonLanguageRequirement.language, updatedLanguage),
    }),
  ]);

  const candidateLessonIds = new Set(
    [...themeReqs, ...languageReqs]
      .map((r) => r.lessonId)
      .filter((id) => id !== excludeLessonId),
  );
  if (candidateLessonIds.size === 0) return;

  const candidates = await db.query.lesson.findMany({
    where: inArray(lesson.id, [...candidateLessonIds]),
    with: {
      themeRequirements: true,
      languageRequirements: true,
      completions: { where: (c, { eq }) => eq(c.userId, userId) },
    },
  });

  const [themeSkills, languageSkills] = await Promise.all([
    db.query.userThemeSkill.findMany({
      where: eq(userThemeSkill.userId, userId),
    }),
    db.query.userLanguageSkill.findMany({
      where: eq(userLanguageSkill.userId, userId),
    }),
  ]);
  const themeValues = new Map(themeSkills.map((s) => [s.theme, s.value]));
  const languageValues = new Map(
    languageSkills.map((s) => [s.language, s.value]),
  );
  const updatedThemeSet = new Set(updatedThemes);

  for (const candidate of candidates) {
    if (candidate.completions.length > 0) continue;

    let wasLocked = false;
    let isLocked = false;

    for (const req of candidate.themeRequirements) {
      const newValue = themeValues.get(req.theme) ?? 0;
      const oldValue = updatedThemeSet.has(req.theme) ? newValue - 1 : newValue;
      if (newValue < req.minValue) isLocked = true;
      if (oldValue < req.minValue) wasLocked = true;
    }

    for (const req of candidate.languageRequirements) {
      const newValue = languageValues.get(req.language) ?? 0;
      const oldValue =
        req.language === updatedLanguage ? newValue - 1 : newValue;
      if (newValue < req.minValue) isLocked = true;
      if (oldValue < req.minValue) wasLocked = true;
    }

    if (wasLocked && !isLocked) {
      await notifyLessonUnlocked(userId, candidate.id);
    }
  }
}

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

  let awarded = false;
  let updatedThemes: LessonTheme[] = [];

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

    awarded = true;
    updatedThemes = themes.map((t) => t.theme);
  });

  if (awarded) {
    await notifyNewlyUnlockedLessons({
      userId,
      updatedThemes,
      updatedLanguage: language,
      excludeLessonId: linkedLesson.id,
    });
  }
}
