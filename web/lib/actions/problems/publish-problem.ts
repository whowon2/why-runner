"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem, problemValidation } from "@/drizzle/schema";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canManageProblem } from "@/lib/auth/permissions";
import { computeIoHash } from "@/lib/problem-io-hash";
import {
  getMissingProblemFields,
  PUBLISH_MISSING_FIELDS,
} from "./publish-problem-shared";
import { getProblemChecker } from "@/lib/problem-checker";

export async function publishProblem(problemId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: eq(problem.id, problemId),
  });

  if (!found) throw new Error("Problem not found.");
  if (!(await canManageProblem(found, currentUser.id)))
    throw new Error("Forbidden");
  if (found.status !== "draft")
    throw new Error("Problem is already published.");

  const fields = getMissingProblemFields(found);

  const latestValidation = await db.query.problemValidation.findFirst({
    // Parsons-solution checks reuse this table but are not the
    // problem's own validation (see `problemValidation.exerciseId`).
    where: and(
      eq(problemValidation.problemId, problemId),
      isNull(problemValidation.exerciseId),
    ),
    orderBy: desc(problemValidation.createdAt),
  });
  const currentIoHash = computeIoHash(found.inputs, found.outputs, {
    ...found,
    checker: await getProblemChecker(problemId),
  });
  const hasFreshPass =
    latestValidation?.status === "PASSED" &&
    latestValidation.ioHash === currentIoHash;
  if (!hasFreshPass) fields.push("validation");

  if (fields.length > 0) return fail(PUBLISH_MISSING_FIELDS, { fields });

  const [result] = await db
    .update(problem)
    .set({ status: "published" })
    .where(eq(problem.id, problemId))
    .returning();

  return ok(result);
}
