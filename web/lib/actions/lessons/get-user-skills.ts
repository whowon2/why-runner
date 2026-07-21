"use server";

import { db } from "@/drizzle/db";

export async function getUserSkills(userId: string) {
  const [themeSkills, languageSkills] = await Promise.all([
    db.query.userThemeSkill.findMany({
      where: (s, { eq }) => eq(s.userId, userId),
    }),
    db.query.userLanguageSkill.findMany({
      where: (s, { eq }) => eq(s.userId, userId),
    }),
  ]);

  return { themeSkills, languageSkills };
}
