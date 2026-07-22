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
export type RequirementStatus = Requirement & {
  currentValue: number;
  met: boolean;
};

export async function getRequirementsStatus({
  userId,
  themeRequirements,
  languageRequirements,
}: {
  userId: string;
  themeRequirements: { theme: LessonTheme; minValue: number }[];
  languageRequirements: { language: Language; minValue: number }[];
}): Promise<RequirementStatus[]> {
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

  const statuses: RequirementStatus[] = [];

  for (const req of themeRequirements) {
    const currentValue = themeValues.get(req.theme) ?? 0;
    statuses.push({
      kind: "theme",
      theme: req.theme,
      minValue: req.minValue,
      currentValue,
      met: currentValue >= req.minValue,
    });
  }

  for (const req of languageRequirements) {
    const currentValue = languageValues.get(req.language) ?? 0;
    statuses.push({
      kind: "language",
      language: req.language,
      minValue: req.minValue,
      currentValue,
      met: currentValue >= req.minValue,
    });
  }

  return statuses;
}

export async function getUnmetRequirements(
  args: Parameters<typeof getRequirementsStatus>[0],
): Promise<UnmetRequirement[]> {
  const statuses = await getRequirementsStatus(args);
  return statuses.filter((s) => !s.met);
}
