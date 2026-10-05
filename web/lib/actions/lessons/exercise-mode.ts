"use server";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  type ExerciseMode,
  exercise,
  type Language,
  problemValidation,
  type ProblemValidation,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { computeIoHash } from "@/lib/problem-io-hash";

async function getOwnedExercise(exerciseId: string) {
  const currentUser = await getCurrentUser({});

  const found = await db.query.exercise.findFirst({
    where: eq(exercise.id, exerciseId),
    with: { lesson: true, problem: true },
  });
  if (!found) throw new Error("Exercise not found");
  if (found.lesson.createdBy !== currentUser.id) {
    throw new Error("Not the lesson owner");
  }
  return found;
}

function latestParsonsCheck(exerciseId: string) {
  return db.query.problemValidation.findFirst({
    where: eq(problemValidation.exerciseId, exerciseId),
    orderBy: desc(problemValidation.createdAt),
  });
}

/**
 * Queues a judge run of a candidate Parsons solution against the exercise's
 * problem test cases. Reuses the `problem_validation` judge path, tagged with
 * `exerciseId` so it never counts as the problem's own validation.
 */
export async function checkParsonsSolution(input: {
  exerciseId: string;
  code: string;
  language: Language;
}) {
  const found = await getOwnedExercise(input.exerciseId);

  if (!input.code.trim()) throw new Error("The solution is empty.");
  if (
    found.problem.inputs.length === 0 ||
    found.problem.inputs.length !== found.problem.outputs.length
  ) {
    throw new Error("The problem has no test cases to check against.");
  }

  const [run] = await db
    .insert(problemValidation)
    .values({
      problemId: found.problemId,
      exerciseId: found.id,
      code: input.code,
      language: input.language,
      ioHash: computeIoHash(found.problem.inputs, found.problem.outputs),
    })
    .returning();

  await db.execute(sql`SELECT pg_notify('new_validation', ${run.id})`);

  return run;
}

export interface ExerciseModeState {
  mode: ExerciseMode;
  primaryLanguage: Language | null;
  parsonsSolution: string | null;
  latestParsonsCheck: ProblemValidation | null;
  /** True when `latestParsonsCheck` passed against the problem's current I/O. */
  parsonsCheckPassed: boolean;
}

export async function getExerciseModeState(
  exerciseId: string,
): Promise<ExerciseModeState> {
  const found = await getOwnedExercise(exerciseId);
  const latest = (await latestParsonsCheck(exerciseId)) ?? null;

  return {
    mode: found.mode,
    primaryLanguage: found.primaryLanguage,
    parsonsSolution: found.parsonsSolution,
    latestParsonsCheck: latest,
    parsonsCheckPassed: isFreshPass(latest, found.problem),
  };
}

function isFreshPass(
  run: ProblemValidation | null | undefined,
  linkedProblem: { inputs: string[]; outputs: string[] },
) {
  return (
    run?.status === "PASSED" &&
    run.ioHash === computeIoHash(linkedProblem.inputs, linkedProblem.outputs)
  );
}

/**
 * Sets how students answer an exercise. `blocks` pins the language to
 * Portugol (the block generator's only target). `parsons` only succeeds when
 * the latest Parsons check passed against the problem's current test cases,
 * and the solution is copied from that run — never from client input — so a
 * Parsons exercise always has at least one correct order.
 */
export async function setExerciseMode(input: {
  exerciseId: string;
  mode: ExerciseMode;
}) {
  const found = await getOwnedExercise(input.exerciseId);

  let values: Partial<typeof exercise.$inferInsert>;
  switch (input.mode) {
    case "code":
      values = { mode: "code" };
      break;
    case "blocks":
      values = { mode: "blocks", primaryLanguage: "portugol" };
      break;
    case "parsons": {
      const latest = await latestParsonsCheck(found.id);
      if (!latest || !isFreshPass(latest, found.problem)) {
        throw new Error(
          "Check the Parsons solution against the test cases first.",
        );
      }
      values = {
        mode: "parsons",
        primaryLanguage: latest.language,
        parsonsSolution: latest.code,
      };
      break;
    }
  }

  const [updated] = await db
    .update(exercise)
    .set(values)
    .where(eq(exercise.id, found.id))
    .returning();
  return updated;
}
