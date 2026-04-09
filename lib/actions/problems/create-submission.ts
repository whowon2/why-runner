"use server";

import { sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type CreateSubmissionInput, submission } from "@/drizzle/schema";

export async function createSubmission(input: CreateSubmissionInput) {
  const [sub] = await db.insert(submission).values(input).returning();

  // Send a notification to the judge worker via Postgres LISTEN/NOTIFY
  await db.execute(sql`NOTIFY new_submission, ${sub.id}`);

  console.log("Submission created and judge notified:", sub.id);
}
