"use server";

import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { exerciseConstraint, submission } from "@/drizzle/schema";
import { classifyAlgorithmRequirement } from "./classify-algorithm-requirement";

// Web-side pickup of PENDING_CONSTRAINT_CLASSIFICATION rows (task 4.2). The
// judge writes this status (never network-calling an LLM itself, see
// design.md decision 1); this resolver is the web-side worker that does the
// actual AI classification pass and writes the final verdict. It's invoked
// lazily from `getExerciseSubmissions` — the only read path that can ever
// surface an exercise submission — so no separate cron/queue is needed.
//
// Solution constraints are an exercise-only feature (never contests, never
// standalone/practice submissions): the judge only ever writes
// PENDING_CONSTRAINT_CLASSIFICATION for submissions with an `exerciseId`, so
// this resolver only ever looks at `submission.exerciseId`, never `problemId`.
export async function resolvePendingConstraintClassifications(
  submissionIds: string[],
) {
  if (submissionIds.length === 0) return;

  const pending = await db.query.submission.findMany({
    where: and(
      inArray(submission.id, submissionIds),
      eq(submission.status, "PENDING_CONSTRAINT_CLASSIFICATION"),
      isNotNull(submission.exerciseId),
    ),
  });

  if (pending.length === 0) return;

  await Promise.all(pending.map(resolveOne));
}

async function resolveOne(sub: typeof submission.$inferSelect) {
  if (!sub.exerciseId) return;

  const requirement = await db.query.exerciseConstraint.findFirst({
    where: and(
      eq(exerciseConstraint.exerciseId, sub.exerciseId),
      eq(exerciseConstraint.kind, "algorithm_requirement"),
    ),
  });

  // Constraint was removed after the judge queued this submission for
  // classification — nothing left to check, so it passed I/O + structural
  // checks and there's no requirement left to violate.
  if (!requirement?.description) {
    await db
      .update(submission)
      .set({ status: "PASSED", constraintViolationDetail: null })
      .where(eq(submission.id, sub.id));
    return;
  }

  let classification: Awaited<
    ReturnType<typeof classifyAlgorithmRequirement>
  >;
  try {
    classification = await classifyAlgorithmRequirement({
      requirement: requirement.description,
      code: sub.code,
      language: sub.language ?? "unknown",
    });
  } catch (error) {
    // Leave the row PENDING_CONSTRAINT_CLASSIFICATION so the next poll
    // retries — do not silently mark it PASSED or FAILED on a transient AI
    // error.
    console.error(
      `Algorithm classification failed for submission ${sub.id}:`,
      error,
    );
    return;
  }

  if (classification.satisfied) {
    await db.transaction(async (tx) => {
      await tx
        .update(submission)
        .set({ status: "PASSED", constraintViolationDetail: null })
        .where(eq(submission.id, sub.id));

      // Exercise submissions never carry contestId/questionLetter — they
      // don't participate in contest leaderboard credit at all, so no
      // `user_on_contest` write is needed here.
    });
  } else {
    await db
      .update(submission)
      .set({
        status: "CONSTRAINT_VIOLATION",
        constraintViolationDetail: `algorithm_requirement: ${classification.rationale}`,
      })
      .where(eq(submission.id, sub.id));
  }
}
