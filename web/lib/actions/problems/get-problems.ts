"use server";

import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type ProblemDifficulty,
  problem,
  submission,
  user,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type ProblemSortBy = "solvedBy";
export type SortDirection = "asc" | "desc";

export interface GetProblemsParams {
  page: number;
  pageSize: number;
  search?: string;
  difficulty?: ProblemDifficulty | "all";
  my?: boolean;
  userId?: string;
  sortBy?: ProblemSortBy;
  sortDirection?: SortDirection;
}

export async function getProblems({
  page = 1,
  pageSize = 10,
  search,
  difficulty,
  my,
  userId,
  sortBy,
  sortDirection = "desc",
}: GetProblemsParams) {
  const offset = (page - 1) * pageSize;

  const currentUser = await getCurrentUser({});

  const conditions = [
    or(eq(problem.status, "published"), eq(problem.createdBy, currentUser.id)),
  ];

  if (search) {
    conditions.push(ilike(problem.title, `%${search}%`));
  }

  if (difficulty && difficulty !== "all") {
    conditions.push(eq(problem.difficulty, difficulty));
  }

  if (userId) {
    conditions.push(eq(problem.createdBy, userId));
  } else if (my) {
    conditions.push(eq(problem.createdBy, currentUser.id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Solved-by count needs to be joined in before pagination when sorting by
  // it, since it's computed from `submission`, not a column on `problem`.
  const solvedCounts = db
    .select({
      problemId: submission.problemId,
      solvedByCount: sql<number>`count(distinct ${submission.userId})`.as(
        "solved_by_count",
      ),
    })
    .from(submission)
    .where(eq(submission.status, "PASSED"))
    .groupBy(submission.problemId)
    .as("solved_counts");

  const solvedByCountExpr = sql<number>`coalesce(${solvedCounts.solvedByCount}, 0)`;

  const orderByClause =
    sortBy === "solvedBy"
      ? sortDirection === "asc"
        ? sql`${solvedByCountExpr} asc`
        : sql`${solvedByCountExpr} desc`
      : desc(problem.createdAt);

  // 3. Run queries in parallel (Data + Total Count)
  const [data, totalResult] = await Promise.all([
    // Get the actual data
    db
      .select({
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        code: problem.code,
        description: problem.description,
        difficulty: problem.difficulty,
        status: problem.status,
        createdBy: problem.createdBy,
        creatorName: user.name,
        creatorUsername: user.username,
        exampleCount: problem.exampleCount,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        createdAt: problem.createdAt,
        updatedAt: problem.updatedAt,
        solvedByCount: solvedByCountExpr,
      })
      .from(problem)
      .leftJoin(solvedCounts, eq(solvedCounts.problemId, problem.id))
      .leftJoin(user, eq(user.id, problem.createdBy))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset),

    // Get the total count for pagination
    db.select({ count: count() }).from(problem).where(whereClause),
  ]);

  const problemIds = data.map((p) => p.id);

  const mySolvedRows =
    problemIds.length > 0
      ? await db
          .select({ problemId: submission.problemId })
          .from(submission)
          .where(
            and(
              inArray(submission.problemId, problemIds),
              eq(submission.userId, currentUser.id),
              eq(submission.status, "PASSED"),
            ),
          )
          .groupBy(submission.problemId)
      : [];

  const mySolvedSet = new Set(mySolvedRows.map((row) => row.problemId));

  return {
    data: data.map((p) => ({
      ...p,
      solvedByCount: Number(p.solvedByCount),
      solvedByMe: mySolvedSet.has(p.id),
    })),
    total: totalResult[0]?.count || 0,
  };
}
