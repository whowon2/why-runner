"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

export async function createProblemSubmission(input: {
  code: string;
  language: Language;
  problemId: string;
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

  const [sub] = await db
    .insert(submission)
    .values({
      code: input.code,
      language: input.language,
      problemId: input.problemId,
      contestId: null,
      userId: currentUser.id,
      codeSize: input.code.length,
    })
    .returning();

  // Send a notification to the judge worker via Postgres LISTEN/NOTIFY
  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);
}
