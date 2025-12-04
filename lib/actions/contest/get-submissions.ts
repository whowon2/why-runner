"use server";

import { db } from "@/lib/db";

export async function getContestSubmissions(input: { contestId: number }) {
  const submissions = await db.query.submission.findMany({
    where: (submissions, { eq }) => eq(submissions.contestId, input.contestId),
    with: { user: true, problem: true },
  });

  return submissions;
}
