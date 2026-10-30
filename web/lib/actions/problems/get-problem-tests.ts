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
  /** How many tests aren't samples. */
  hiddenCount: number;
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
    return { samples: [], hiddenCount: 0, all: null };
  }

  const { tests: samples, hiddenCount } = visibleTests(
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
    return { samples, hiddenCount, all: null };
  }

  const all = problemRow.inputs.map((input, i) => ({
    index: i + 1,
    input,
    output: problemRow.outputs[i],
  }));

  return { samples, hiddenCount, all };
}
