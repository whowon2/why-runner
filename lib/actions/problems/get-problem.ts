"use server";

import { db } from "@/drizzle/db";

export async function getProblem(problemId: string) {
  return await db.query.problem.findFirst({
    where: (problems, { eq }) => eq(problems.id, problemId),
  });
}
