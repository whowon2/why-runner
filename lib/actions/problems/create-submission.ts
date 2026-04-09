"use server";

import { sql, and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type CreateSubmissionInput, submission, userOnContest } from "@/drizzle/schema";

export async function createSubmission(input: CreateSubmissionInput) {
  // Check if user already got it right
  const userProgress = await db.query.userOnContest.findFirst({
    where: and(
      eq(userOnContest.userId, input.userId),
      eq(userOnContest.contestId, input.contestId)
    ),
  });

  if (userProgress?.answered.includes(input.questionLetter)) {
    throw new Error("You have already answered this question correctly.");
  }

  const [sub] = await db.insert(submission).values(input).returning();

  // Send a notification to the judge worker via Postgres LISTEN/NOTIFY
  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);

  console.log("Submission created and judge notified:", sub.id);
}
