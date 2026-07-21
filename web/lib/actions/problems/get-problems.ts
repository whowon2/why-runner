"use server";

import { and, count, eq, ilike } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type ProblemDifficulty, problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface GetProblemsParams {
  page: number;
  pageSize: number;
  search?: string;
  difficulty?: ProblemDifficulty | "all";
  my?: boolean;
}

export async function getProblems({
  page = 1,
  pageSize = 10,
  search,
  difficulty,
  my,
}: GetProblemsParams) {
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (search) {
    conditions.push(ilike(problem.title, `%${search}%`));
  }

  if (difficulty && difficulty !== "all") {
    conditions.push(eq(problem.difficulty, difficulty));
  }

  if (my) {
    const currentUser = await getCurrentUser({});
    conditions.push(eq(problem.createdBy, currentUser.id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 3. Run queries in parallel (Data + Total Count)
  const [data, totalResult] = await Promise.all([
    // Get the actual data
    db.query.problem.findMany({
      limit: pageSize,
      offset: offset,
      where: whereClause,
      columns: {
        inputs: false,
        outputs: false,
      },
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
