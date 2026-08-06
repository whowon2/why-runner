"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  problem,
  problemReferenceSolution,
  problemValidation,
  type ProblemValidation,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { computeIoHash } from "@/lib/problem-io-hash";

export interface ProblemValidationState {
  reference: { code: string; language: string | null } | null;
  latest: ProblemValidation | null;
  /** True when `latest` is missing, not PASSED, or ran against different I/O. */
  isStale: boolean;
}

export async function getProblemValidation(
  problemId: string,
): Promise<ProblemValidationState> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
    columns: { inputs: true, outputs: true },
  });

  if (!found) throw new Error("Problem not found.");

  const [reference, latest] = await Promise.all([
    db.query.problemReferenceSolution.findFirst({
      where: eq(problemReferenceSolution.problemId, problemId),
    }),
    db.query.problemValidation.findFirst({
      where: eq(problemValidation.problemId, problemId),
      orderBy: desc(problemValidation.createdAt),
    }),
  ]);

  const currentIoHash = computeIoHash(found.inputs, found.outputs);
  const isStale =
    !latest ||
    latest.status !== "PASSED" ||
    latest.ioHash !== currentIoHash;

  return {
    reference: reference
      ? { code: reference.code, language: reference.language }
      : null,
    latest: latest ?? null,
    isStale,
  };
}
