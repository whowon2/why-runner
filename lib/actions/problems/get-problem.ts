"use server";

import { db } from "@/lib/db";

export async function getProblem(problemId: number) {
  return await db.query.problem.findFirst({
    where: (problems, { eq }) => eq(problems.id, problemId),
  });
}
