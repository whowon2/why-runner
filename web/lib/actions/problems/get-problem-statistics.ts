"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem, submission } from "@/drizzle/schema";

export async function getProblemStatistics(problemId: string) {
  const [problemRow, [solvedRow], [attemptedRow]] = await Promise.all([
    db.query.problem.findFirst({
      where: eq(problem.id, problemId),
      columns: {
        timeLimitMs: true,
        memoryLimitMb: true,
      },
    }),
    db
      .select({
        count: sql<number>`count(distinct ${submission.userId})`,
      })
      .from(submission)
      .where(
        and(
          eq(submission.problemId, problemId),
          eq(submission.status, "PASSED"),
        ),
      ),
    db
      .select({
        count: sql<number>`count(distinct ${submission.userId})`,
      })
      .from(submission)
      .where(eq(submission.problemId, problemId)),
  ]);

  const solvedByCount = Number(solvedRow?.count ?? 0);
  const attemptedByCount = Number(attemptedRow?.count ?? 0);

  return {
    solvedByCount,
    attemptedByCount,
    successRate: attemptedByCount > 0 ? solvedByCount / attemptedByCount : 0,
    timeLimitMs: problemRow?.timeLimitMs ?? null,
    memoryLimitMb: problemRow?.memoryLimitMb ?? null,
  };
}
