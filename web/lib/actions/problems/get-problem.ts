"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isAdmin } from "@/lib/auth/permissions";
import { visibleTests } from "@/lib/judge-report";

export async function getProblem(problemId: string) {
  const currentUser = await getCurrentUser({});
  // Admins see every draft too.
  const admin = await isAdmin(currentUser.id);

  const result = await db.query.problem.findFirst({
    where: (problems, { and, eq, or }) =>
      and(
        eq(problems.id, problemId),
        admin
          ? undefined
          : or(
              eq(problems.status, "published"),
              eq(problems.createdBy, currentUser.id),
            ),
      ),
  });

  if (!result) return result;

  // Only the examples, even for the author: this feeds the statement page.
  const { tests } = visibleTests(result.inputs, result.outputs, {
    fullAccess: false,
    visible: result.visible,
  });

  return {
    ...result,
    inputs: tests.map((test) => test.input),
    outputs: tests.map((test) => test.output),
  };
}
