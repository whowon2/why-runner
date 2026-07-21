"use server";

import { db } from "@/drizzle/db";

export async function getProblem(problemId: string) {
  const result = await db.query.problem.findFirst({
    where: (problems, { eq }) => eq(problems.id, problemId),
  });

  if (!result) return result;

  return {
    ...result,
    inputs: result.inputs.slice(0, result.exampleCount),
    outputs: result.outputs.slice(0, result.exampleCount),
  };
}
