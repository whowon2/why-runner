"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  problem,
  problemReferenceSolution,
  problemValidation,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notifyJudge } from "@/lib/judge";
import { computeIoHash } from "@/lib/problem-io-hash";
import { getProblemChecker } from "@/lib/problem-checker";

export async function triggerProblemValidation(problemId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  if (!found) throw new Error("Problem not found.");

  if (
    found.inputs.length === 0 ||
    found.inputs.length !== found.outputs.length
  ) {
    throw new Error("At least one test case is required to validate.");
  }

  const reference = await db.query.problemReferenceSolution.findFirst({
    where: eq(problemReferenceSolution.problemId, problemId),
  });

  if (!reference || !reference.code.trim() || !reference.language) {
    throw new Error(
      "A reference solution (code and language) is required to validate.",
    );
  }

  const ioHash = computeIoHash(found.inputs, found.outputs, {
    ...found,
    checker: await getProblemChecker(problemId),
  });

  const [validation] = await db
    .insert(problemValidation)
    .values({
      problemId,
      code: reference.code,
      language: reference.language,
      ioHash,
    })
    .returning();

  await notifyJudge("new_validation", validation.id);

  return validation;
}
