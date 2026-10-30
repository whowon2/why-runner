"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, submission } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { assertClassMember } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { notifyJudge } from "@/lib/judge";
import { blocksProgram } from "@/lib/blocks/program";
import type { SerializedWorkspace } from "@/lib/blocks/portugol-generator";
import {
  assembleParsons,
  isValidParsonsAnswer,
  type ParsonsLine,
} from "@/lib/parsons";
import { normalizeCode } from "@/lib/normalize-code";
import { languageSchema, MAX_CODE_LENGTH } from "@/lib/submission-limits";

const RATE_LIMIT_WINDOW_SECS = 30;
const RATE_LIMIT_MAX = 5;

export type ExerciseSubmissionInput =
  | { exerciseId: string; mode: "code"; code: string; language: Language }
  | { exerciseId: string; mode: "blocks"; workspace: SerializedWorkspace }
  | { exerciseId: string; mode: "parsons"; lines: ParsonsLine[] };

export async function createExerciseSubmission(
  input: ExerciseSubmissionInput,
): Promise<
  ActionResult<
    typeof submission.$inferSelect,
    "RATE_LIMITED" | "CODE_TOO_LARGE"
  >
> {
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
    return fail("RATE_LIMITED", { seconds: RATE_LIMIT_WINDOW_SECS });
  }

  // Look up by exercise id, not problem id: a problem can back more than one
  // exercise entry across lessons, so problemId alone is ambiguous.
  const linkedExercise = await db.query.exercise.findFirst({
    where: (exercise, { eq }) => eq(exercise.id, input.exerciseId),
    with: { lesson: { columns: { dueDate: true, classroomId: true } } },
  });

  if (!linkedExercise) throw new Error("Exercise not found");
  await assertClassMember(linkedExercise.lesson.classroomId, currentUser.id);

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
      if (!languageSchema.safeParse(input.language).success) {
        throw new Error("Unsupported language.");
      }
      if (typeof input.code !== "string") throw new Error("Invalid code.");
      program = {
        // Pasted invisible characters would break the program.
        code: normalizeCode(input.code, input.language),
        language: input.language,
        visualSource: null,
      };
      break;
    case "blocks": {
      const code = blocksProgram(input.workspace);
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

  if (program.code.length > MAX_CODE_LENGTH) {
    return fail("CODE_TOO_LARGE", { max: MAX_CODE_LENGTH });
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
      codeSize: program.code.length,
    })
    .returning();

  await notifyJudge("new_submission", sub.id);

  return ok(sub);
}
