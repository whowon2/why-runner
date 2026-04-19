"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type CreateSubmissionInput,
  submission,
  userOnContest,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function createSubmission(input: CreateSubmissionInput) {
  const currentUser = await getCurrentUser({});

  const userProgress = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.userId, currentUser.id),
      eq(userOnContest.contestId, input.contestId),
    ),
  });

  if (userProgress?.answered.includes(input.questionLetter)) {
    throw new Error("You have already answered this question correctly.");
  }

  const [sub] = await db
    .insert(submission)
    .values({ ...input, userId: currentUser.id })
    .returning();

  // Send a notification to the judge worker via Postgres LISTEN/NOTIFY
  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);

  console.log("Submission created and judge notified:", sub.id);
}
