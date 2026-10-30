"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { visibleTests } from "@/lib/judge-report";

export interface ProblemTestCase {
  /** 1-based test number in the problem. */
  index: number;
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
      visible: true,
    },
  });

  if (!problemRow) {
    return { samples: [], all: null };
  }

  const { tests: samples } = visibleTests(
    problemRow.inputs,
    problemRow.outputs,
    { fullAccess: false, visible: problemRow.visible },
  );

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
    index: i + 1,
    input,
    output: problemRow.outputs[i],
  }));

  return { samples, all };
}
