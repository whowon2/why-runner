"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getProblem(problemId: string) {
  const currentUser = await getCurrentUser({});

  const result = await db.query.problem.findFirst({
    where: (problems, { and, eq, or }) =>
      and(
        eq(problems.id, problemId),
        or(
          eq(problems.status, "published"),
          eq(problems.createdBy, currentUser.id),
        ),
      ),
  });

  if (!result) return result;

  return {
    ...result,
    inputs: result.inputs.slice(0, result.exampleCount),
    outputs: result.outputs.slice(0, result.exampleCount),
  };
}
