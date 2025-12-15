"use server";

import { and, count, eq, ilike } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type ProblemDifficulty, problem } from "@/drizzle/schema";

export interface GetProblemsParams {
  page: number;
  pageSize: number;
  search?: string;
  difficulty?: ProblemDifficulty | "all";
  userId?: string; // ID of current user (for "my problems")
  my?: boolean; // Toggle for "my problems"
}

export async function getProblems({
  page = 1,
  pageSize = 10,
  search,
  difficulty,
  userId,
  my,
}: GetProblemsParams) {
  // 1. Calculate offset
  const offset = (page - 1) * pageSize;

  // 2. Build where conditions
  const conditions = [];

  if (search) {
    // ilike is case-insensitive search
    conditions.push(ilike(problem.title, `%${search}%`));
  }

  if (difficulty && difficulty !== "all") {
    conditions.push(eq(problem.difficulty, difficulty));
  }

  if (my && userId) {
    conditions.push(eq(problem.createdBy, userId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 3. Run queries in parallel (Data + Total Count)
  const [data, totalResult] = await Promise.all([
    // Get the actual data
    db.query.problem.findMany({
      limit: pageSize,
      offset: offset,
      where: whereClause,
      // Optional: Add default sorting
      // orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),

    // Get the total count for pagination
    db
      .select({ count: count() })
      .from(problem)
      .where(whereClause),
  ]);

  return {
    data,
    total: totalResult[0]?.count || 0,
  };
}
