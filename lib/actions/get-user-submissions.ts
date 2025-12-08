"use server";

import { db } from "@/drizzle/db";

export async function getUserSubmissions(input: { userId: string }) {
  const submissions = await db.query.submission.findMany({
    where: (submissions, { eq }) => eq(submissions.userId, input.userId),
    with: { user: true, problem: true },
  });

  return submissions;
}
