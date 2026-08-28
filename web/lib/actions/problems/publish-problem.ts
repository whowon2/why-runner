"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem, problemValidation } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { computeIoHash } from "@/lib/problem-io-hash";
import {
  getMissingProblemFields,
  PUBLISH_MISSING_FIELDS_PREFIX,
} from "./publish-problem-shared";

export async function publishProblem(problemId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: eq(problem.id, problemId),
  });

  if (!found) throw new Error("Problem not found.");
  if (found.createdBy !== currentUser.id) throw new Error("Forbidden");
  if (found.status !== "draft")
    throw new Error("Problem is already published.");

  const fields = getMissingProblemFields(found);

  const latestValidation = await db.query.problemValidation.findFirst({
    where: eq(problemValidation.problemId, problemId),
    orderBy: desc(problemValidation.createdAt),
  });
  const currentIoHash = computeIoHash(found.inputs, found.outputs);
  const hasFreshPass =
    latestValidation?.status === "PASSED" &&
    latestValidation.ioHash === currentIoHash;
  if (!hasFreshPass) fields.push("validation");

  if (fields.length > 0)
    throw new Error(`${PUBLISH_MISSING_FIELDS_PREFIX}${fields.join(",")}`);

  const [result] = await db
    .update(problem)
    .set({ status: "published" })
    .where(eq(problem.id, problemId))
    .returning();

  return result;
}
