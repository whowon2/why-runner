"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export interface ProblemTestCase {
  input: string;
  output: string;
}

export async function getProblemTests(problemId: string): Promise<{
  samples: ProblemTestCase[];
  all: ProblemTestCase[] | null;
}> {
  const currentUser = await getCurrentUser({});

  const problemRow = await db.query.problem.findFirst({
    where: eq(problem.id, problemId),
    columns: {
      inputs: true,
      outputs: true,
      exampleCount: true,
    },
  });

  if (!problemRow) {
    return { samples: [], all: null };
  }

  const samples = problemRow.inputs
    .slice(0, problemRow.exampleCount)
    .map((input, i) => ({ input, output: problemRow.outputs[i] }));

  const solved = await db.query.submission.findFirst({
    where: and(
      eq(submission.problemId, problemId),
      eq(submission.userId, currentUser.id),
      eq(submission.status, "PASSED"),
    ),
  });

  if (!solved) {
    return { samples, all: null };
  }

  const all = problemRow.inputs.map((input, i) => ({
    input,
    output: problemRow.outputs[i],
  }));

  return { samples, all };
}
