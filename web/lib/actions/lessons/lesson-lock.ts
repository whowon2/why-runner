import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type Language,
  type LessonTheme,
  userLanguageSkill,
  userThemeSkill,
} from "@/drizzle/schema";

export type Requirement =
  | { kind: "theme"; theme: LessonTheme; minValue: number }
  | { kind: "language"; language: Language; minValue: number };

export type UnmetRequirement = Requirement & { currentValue: number };

export async function getUnmetRequirements({
  userId,
  themeRequirements,
  languageRequirements,
}: {
  userId: string;
  themeRequirements: { theme: LessonTheme; minValue: number }[];
  languageRequirements: { language: Language; minValue: number }[];
}): Promise<UnmetRequirement[]> {
  if (!themeRequirements.length && !languageRequirements.length) return [];

  const [themeSkills, languageSkills] = await Promise.all([
    themeRequirements.length
      ? db.query.userThemeSkill.findMany({
          where: and(
            eq(userThemeSkill.userId, userId),
            inArray(
              userThemeSkill.theme,
              themeRequirements.map((r) => r.theme),
            ),
          ),
        })
      : Promise.resolve([]),
    languageRequirements.length
      ? db.query.userLanguageSkill.findMany({
          where: and(
            eq(userLanguageSkill.userId, userId),
            inArray(
              userLanguageSkill.language,
              languageRequirements.map((r) => r.language),
            ),
          ),
        })
      : Promise.resolve([]),
  ]);

  const themeValues = new Map(themeSkills.map((s) => [s.theme, s.value]));
  const languageValues = new Map(
    languageSkills.map((s) => [s.language, s.value]),
  );

  const unmet: UnmetRequirement[] = [];

  for (const req of themeRequirements) {
    const currentValue = themeValues.get(req.theme) ?? 0;
    if (currentValue < req.minValue) {
      unmet.push({ kind: "theme", theme: req.theme, minValue: req.minValue, currentValue });
    }
  }

  for (const req of languageRequirements) {
    const currentValue = languageValues.get(req.language) ?? 0;
    if (currentValue < req.minValue) {
      unmet.push({
        kind: "language",
        language: req.language,
        minValue: req.minValue,
        currentValue,
      });
    }
  }

  return unmet;
}
