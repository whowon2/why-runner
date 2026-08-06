"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  problem,
  problemReferenceSolution,
  problemValidation,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { computeIoHash } from "@/lib/problem-io-hash";

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

  const ioHash = computeIoHash(found.inputs, found.outputs);

  const [validation] = await db
    .insert(problemValidation)
    .values({
      problemId,
      code: reference.code,
      language: reference.language,
      ioHash,
    })
    .returning();

  // Send a notification to the judge worker via Postgres LISTEN/NOTIFY
  await db.execute(sql`SELECT pg_notify('new_validation', ${validation.id})`);

  return validation;
}
