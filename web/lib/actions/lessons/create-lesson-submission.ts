"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

export async function createLessonSubmission(input: {
  lessonId: string;
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

  // Look up by lesson id, not problem id: a problem can back more than one
  // lesson entry across tracks, so problemId alone is ambiguous.
  const linkedLesson = await db.query.lesson.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, input.lessonId),
    with: { track: { columns: { dueDate: true } } },
  });

  if (!linkedLesson) throw new Error("Lesson not found");

  // Students may resubmit as many times as they like before the due date —
  // only a passed due date locks the assignment (see `submitTrack`, which
  // is what actually snapshots each lesson's *latest* submission for the
  // professor's review, itself only readable after the due date).
  if (linkedLesson.track.dueDate && linkedLesson.track.dueDate < new Date()) {
    throw new Error("This assignment's due date has passed.");
  }

  const [sub] = await db
    .insert(submission)
    .values({
      problemId: linkedLesson.problemId,
      lessonId: linkedLesson.id,
      code: input.code,
      language: input.language,
      userId: currentUser.id,
    })
    .returning();

  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);

  return sub;
}
