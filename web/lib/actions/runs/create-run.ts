"use server";

import { and, asc, count, eq, gte, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  codeRun,
  contest,
  type Language,
  problem,
  problemOnContest,
  userOnContest,
} from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassMember, isAdmin } from "@/lib/auth/permissions";
import { blocksProgram } from "@/lib/blocks/program";
import { notifyJudge } from "@/lib/judge";
import {
  languageSchema,
  MAX_CODE_LENGTH,
  MAX_RUN_STDIN,
} from "@/lib/submission-limits";

// Stricter than submissions (5/30s): runs are cheap to click repeatedly.
const RATE_LIMIT_WINDOW_SECS = 60;
const RATE_LIMIT_MAX = 10;
// A run still PENDING/RUNNING after this long no longer blocks a new one
// (the judge fails stuck RUNNING runs after the same time).
const IN_FLIGHT_WINDOW_SECS = 120;

// Only these fields come from the client; status, userId and the result
// columns are decided here and by the judge.
const stdinSchema = z.string();
// Plain union: the two exercise variants share `context: "exercise"`, which
// z.discriminatedUnion rejects as a duplicate discriminator.
const inputSchema = z.union([
  z.object({
    context: z.literal("problem"),
    problemId: z.string().min(1),
    code: z.string().min(1),
    language: languageSchema,
    stdin: stdinSchema,
  }),
  z.object({
    context: z.literal("contest"),
    contestId: z.string().min(1),
    problemId: z.string().min(1),
    code: z.string().min(1),
    language: languageSchema,
    stdin: stdinSchema,
  }),
  z.object({
    context: z.literal("exercise"),
    exerciseId: z.string().min(1),
    mode: z.literal("code"),
    code: z.string().min(1),
    language: languageSchema,
    stdin: stdinSchema,
  }),
  z.object({
    context: z.literal("exercise"),
    exerciseId: z.string().min(1),
    mode: z.literal("blocks"),
    workspace: z.unknown(),
    stdin: stdinSchema,
  }),
]);

export type CreateRunInput = z.input<typeof inputSchema>;

export type CreateRunError =
  | "RUNS_DISABLED"
  | "RATE_LIMITED"
  | "RUN_IN_PROGRESS"
  | "INPUT_TOO_LARGE"
  | "CODE_TOO_LARGE"
  | "CONTEST_NOT_STARTED";

/**
 * "Run with custom input": queues one ungraded execution of the program with
 * the user's stdin. Never touches `submission`, so nothing graded (scores,
 * gradebook, completion, standings, statistics) ever sees it. Access mirrors
 * the matching submit action, minus the checks that only protect grading
 * (lesson due date, contest problem already solved).
 */
export async function createRun(
  rawInput: CreateRunInput,
): Promise<ActionResult<{ id: string }, CreateRunError>> {
  const currentUser = await getCurrentUser({});
  const input = inputSchema.parse(rawInput);

  if (input.stdin.length > MAX_RUN_STDIN) {
    return fail("INPUT_TOO_LARGE", { max: MAX_RUN_STDIN });
  }

  const now = Date.now();
  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(codeRun)
    .where(
      and(
        eq(codeRun.userId, currentUser.id),
        gte(codeRun.createdAt, new Date(now - RATE_LIMIT_WINDOW_SECS * 1000)),
      ),
    );
  if (recentCount >= RATE_LIMIT_MAX) {
    return fail("RATE_LIMITED", { seconds: RATE_LIMIT_WINDOW_SECS });
  }

  const inFlight = await db.query.codeRun.findFirst({
    where: and(
      eq(codeRun.userId, currentUser.id),
      inArray(codeRun.status, ["PENDING", "RUNNING"]),
      gte(codeRun.createdAt, new Date(now - IN_FLIGHT_WINDOW_SECS * 1000)),
    ),
    columns: { id: true },
  });
  if (inFlight) return fail("RUN_IN_PROGRESS");

  let target: {
    problemId: string;
    contestId: string | null;
    exerciseId: string | null;
    code: string;
    language: Language;
  };

  switch (input.context) {
    case "problem": {
      // Same visibility rule as the problem page: published, or your own
      // draft (admins see every draft).
      const admin = await isAdmin(currentUser.id);
      const visible = await db.query.problem.findFirst({
        where: and(
          eq(problem.id, input.problemId),
          admin
            ? undefined
            : or(
                eq(problem.status, "published"),
                eq(problem.createdBy, currentUser.id),
              ),
        ),
        columns: { id: true },
      });
      if (!visible) throw new Error("Problem not found.");
      target = {
        problemId: input.problemId,
        contestId: null,
        exerciseId: null,
        code: input.code,
        language: input.language,
      };
      break;
    }
    case "contest": {
      const found = await db.query.contest.findFirst({
        where: eq(contest.id, input.contestId),
        columns: { status: true, startDate: true, allowRuns: true },
      });
      if (!found || found.status !== "published") {
        throw new Error("Contest not found.");
      }
      if (!found.allowRuns) return fail("RUNS_DISABLED");
      if (found.startDate && new Date() < found.startDate) {
        return fail("CONTEST_NOT_STARTED");
      }

      const participant = await db.query.userOnContest.findFirst({
        where: and(
          eq(userOnContest.userId, currentUser.id),
          eq(userOnContest.contestId, input.contestId),
        ),
        columns: { joinStatus: true },
      });
      if (!participant || participant.joinStatus !== "accepted") {
        throw new Error("You are not a participant in this contest.");
      }

      const attached = await db
        .select({ problemId: problemOnContest.problemId })
        .from(problemOnContest)
        .where(eq(problemOnContest.contestId, input.contestId))
        .orderBy(asc(problemOnContest.order));
      if (!attached.some((p) => p.problemId === input.problemId)) {
        throw new Error("Problem not found.");
      }

      target = {
        problemId: input.problemId,
        contestId: input.contestId,
        exerciseId: null,
        code: input.code,
        language: input.language,
      };
      break;
    }
    case "exercise": {
      const linked = await db.query.exercise.findFirst({
        where: (exercise, { eq }) => eq(exercise.id, input.exerciseId),
        columns: { id: true, problemId: true, mode: true },
        with: { lesson: { columns: { classroomId: true } } },
      });
      if (!linked) throw new Error("Exercise not found");
      await assertClassMember(linked.lesson.classroomId, currentUser.id);

      // The exercise's mode is authoritative (no runs for Parsons). Blocks
      // run the Portugol generated here, never client code.
      if (input.mode !== linked.mode) {
        throw new Error("This exercise expects a different kind of answer.");
      }
      target = {
        problemId: linked.problemId,
        contestId: null,
        exerciseId: linked.id,
        ...(input.mode === "blocks"
          ? {
              code: blocksProgram(input.workspace),
              language: "portugol" as const,
            }
          : { code: input.code, language: input.language }),
      };
      break;
    }
  }

  if (target.code.length > MAX_CODE_LENGTH) {
    return fail("CODE_TOO_LARGE", { max: MAX_CODE_LENGTH });
  }

  const [run] = await db
    .insert(codeRun)
    .values({
      userId: currentUser.id,
      problemId: target.problemId,
      contestId: target.contestId,
      exerciseId: target.exerciseId,
      language: target.language,
      code: target.code,
      stdin: input.stdin,
    })
    .returning({ id: codeRun.id });

  await notifyJudge("new_run", run.id);

  return ok({ id: run.id });
}
