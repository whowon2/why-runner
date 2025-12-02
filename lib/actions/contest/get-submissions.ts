"use server";

import { db } from "@/lib/db";

export async function getSubmissions(contestId: number) {
  const submissions = await db.query.submission.findMany({
    where: (submissions, { eq }) => eq(submissions.contestId, contestId),
    with: { user: true, problem: true },
  });

  return submissions;
}
