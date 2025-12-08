"use server";

import { db } from "@/drizzle/db";

export async function getProblemSubmissions(problemId: number) {
  const submissions = await db.query.submission.findMany({
    where: (submissions, { eq }) => eq(submissions.problemId, problemId),
    with: { user: true, problem: true },
  });

  return submissions;
}
