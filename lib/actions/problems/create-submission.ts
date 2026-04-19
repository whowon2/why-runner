"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type CreateSubmissionInput,
  submission,
  userOnContest,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

export async function createSubmission(input: CreateSubmissionInput) {
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

  const userProgress = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.userId, currentUser.id),
      eq(userOnContest.contestId, input.contestId),
    ),
  });

  if (!userProgress) throw new Error("You are not a participant in this contest.");
  if (userProgress.joinStatus === "pending") throw new Error("Your join request is still pending approval.");
  if (userProgress.answered.includes(input.questionLetter)) {
    throw new Error("You have already answered this question correctly.");
  }

  const [sub] = await db
    .insert(submission)
    .values({ ...input, userId: currentUser.id })
    .returning();

  // Send a notification to the judge worker via Postgres LISTEN/NOTIFY
  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);
}
