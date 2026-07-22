"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUnmetRequirements } from "@/lib/actions/lessons/lesson-lock";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

export async function createLessonSubmission(input: {
  problemId: string;
  code: string;
  language: Language;
}) {
  const currentUser = await getCurrentUser({});

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECS * 1000);
  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(submission)
    .where(
      and(
        eq(submission.userId, currentUser.id),
        gte(submission.createdAt, windowStart),
      ),
    );

  if (recentCount >= RATE_LIMIT_MAX) {
    throw new Error(
      `Rate limit exceeded. Max ${RATE_LIMIT_MAX} submissions per ${RATE_LIMIT_WINDOW_SECS}s.`,
    );
  }

  const linkedLesson = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.problemId, input.problemId),
    with: { themeRequirements: true, languageRequirements: true },
  });

  if (linkedLesson) {
    const unmetRequirements = await getUnmetRequirements({
      userId: currentUser.id,
      themeRequirements: linkedLesson.themeRequirements,
      languageRequirements: linkedLesson.languageRequirements,
    });

    if (unmetRequirements.length > 0) {
      throw new Error("You have not met the requirements for this lesson.");
    }
  }

  const [sub] = await db
    .insert(submission)
    .values({ ...input, userId: currentUser.id })
    .returning();

  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);

  return sub;
}
