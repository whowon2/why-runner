"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, submission } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  generatePortugol,
  type SerializedWorkspace,
} from "@/lib/blocks/portugol-generator";
import {
  assembleParsons,
  isValidParsonsAnswer,
  type ParsonsLine,
} from "@/lib/parsons";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;
// Upper bound on a stored Blockly workspace, as serialized JSON.
const MAX_WORKSPACE_BYTES = 200_000;

export type ExerciseSubmissionInput =
  | { exerciseId: string; mode: "code"; code: string; language: Language }
  | { exerciseId: string; mode: "blocks"; workspace: SerializedWorkspace }
  | { exerciseId: string; mode: "parsons"; lines: ParsonsLine[] };

export async function createExerciseSubmission(input: ExerciseSubmissionInput) {
  const currentUser = await getCurrentUser({});

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECS * 1000);
  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(submission)
    .where(
      and(
        eq(submission.userId, currentUser.id),
        gte(submission.createdAt, windowStart),
      ),
    );

  if (recentCount >= RATE_LIMIT_MAX) {
    throw new Error(
      `Rate limit exceeded. Max ${RATE_LIMIT_MAX} submissions per ${RATE_LIMIT_WINDOW_SECS}s.`,
    );
  }

  // Look up by exercise id, not problem id: a problem can back more than one
  // exercise entry across lessons, so problemId alone is ambiguous.
  const linkedExercise = await db.query.exercise.findFirst({
    where: (exercise, { eq }) => eq(exercise.id, input.exerciseId),
    with: { lesson: { columns: { dueDate: true } } },
  });

  if (!linkedExercise) throw new Error("Exercise not found");

  // Students may resubmit as many times as they like before the due date —
  // only a passed due date locks the lesson (see `submitLesson`, which is
  // what actually snapshots each exercise's *latest* submission for the
  // professor's review, itself only readable after the due date).
  if (
    linkedExercise.lesson.dueDate &&
    linkedExercise.lesson.dueDate < new Date()
  ) {
    throw new Error("This lesson's due date has passed.");
  }

  // The exercise's mode is authoritative: a block or Parsons exercise can't
  // be answered with typed code. In visual modes the program the judge runs
  // is always derived here from the visual source, never taken from the
  // client.
  if (input.mode !== linkedExercise.mode) {
    throw new Error("This exercise expects a different kind of answer.");
  }

  let program: {
    code: string;
    language: Language;
    visualSource: unknown;
  };
  switch (input.mode) {
    case "code":
      program = {
        code: input.code,
        language: input.language,
        visualSource: null,
      };
      break;
    case "blocks": {
      if (typeof input.workspace !== "object" || input.workspace === null) {
        throw new Error("Invalid block program.");
      }
      if (JSON.stringify(input.workspace).length > MAX_WORKSPACE_BYTES) {
        throw new Error("The block program is too large.");
      }
      const { code, errors } = generatePortugol(input.workspace);
      if (errors.length > 0) {
        throw new Error("The blocks are incomplete. Check the code panel.");
      }
      program = { code, language: "portugol", visualSource: input.workspace };
      break;
    }
    case "parsons": {
      const { parsonsSolution, primaryLanguage } = linkedExercise;
      if (!parsonsSolution || !primaryLanguage) {
        throw new Error("This exercise is not set up yet.");
      }
      if (!isValidParsonsAnswer(parsonsSolution, input.lines)) {
        throw new Error("Use every given line exactly once.");
      }
      const lines = input.lines.map((l) => ({
        text: l.text.trim(),
        indent: l.indent,
      }));
      program = {
        code: assembleParsons(lines),
        language: primaryLanguage,
        visualSource: { lines },
      };
      break;
    }
  }

  const [sub] = await db
    .insert(submission)
    .values({
      problemId: linkedExercise.problemId,
      exerciseId: linkedExercise.id,
      code: program.code,
      language: program.language,
      editorMode: input.mode === "code" ? null : input.mode,
      visualSource: program.visualSource,
      userId: currentUser.id,
    })
    .returning();

  await db.execute(sql`SELECT pg_notify('new_submission', ${sub.id})`);

  return sub;
}
