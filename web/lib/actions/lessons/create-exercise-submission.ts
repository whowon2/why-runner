"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

export async function createExerciseSubmission(input: {
  exerciseId: string;
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

  // Look up by exercise id, not problem id: a problem can back more than one
  // exercise entry across lessons, so problemId alone is ambiguous.
  const linkedExercise = await db.query.exercise.findFirst({
    where: (exercise, { eq }) => eq(exercise.id, input.exerciseId),
    with: { lesson: { columns: { dueDate: true } } },
  });

  if (!linkedExercise) throw new Error("Exercise not found");

  // Students may resubmit as many times as they like before the due date —
  // only a passed due date locks the lesson (see `submitLesson`, which is
  // what actually snapshots each exercise's *latest* submission for the
  // professor's review, itself only readable after the due date).
  if (
    linkedExercise.lesson.dueDate &&
    linkedExercise.lesson.dueDate < new Date()
  ) {
    throw new Error("This lesson's due date has passed.");
  }

  const [sub] = await db
    .insert(submission)
    .values({
      problemId: linkedExercise.problemId,
      exerciseId: linkedExercise.id,
      code: input.code,
      language: input.language,
      userId: currentUser.id,
    })
    .returning();

  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);

  return sub;
}
