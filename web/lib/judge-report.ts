/**
 * The judge writes the full `JudgeReport` (see judge/src/models.rs) to
 * `submission.output`, including the first failing test's input, expected
 * output, actual output and stderr, hidden tests too. Every server action
 * that returns `output` to a client must pass it through `redactReport` so
 * hidden tests can't be read back (submission-feedback-visibility spec).
 *
 * Pure module: no DB, runs in `bun test`.
 */

import type { Submission } from "@/drizzle/schema";

type SubmissionStatus = Submission["status"];

export type FailureKind =
  | "compile_error"
  | "time_limit"
  | "memory_limit"
  | "runtime_error"
  | "wrong_answer"
  | "judge_error";

export interface TestCaseResult {
  index: number;
  input?: string;
  expected?: string;
  actual?: string;
  error?: string | null;
  failure_kind?: FailureKind;
  /** Set when some fields were withheld from this viewer. */
  redacted?: boolean;
}

export interface JudgeReport {
  passed: boolean;
  /**
   * `PASSED` or the first failure's verdict. Missing on reports written
   * before the judge had distinct verdicts.
   */
  verdict?: SubmissionStatus;
  total_tests: number;
  passed_count: number;
  failure_details?: TestCaseResult | null;
  constraint_violation?: unknown;
}

export type TestVisibility = "problem_default" | "show_all" | "hide_all";

export type VisibilityContext = {
  /**
   * Problem author (or, for exercises, the lesson or class owner): sees
   * every test.
   */
  fullAccess: boolean;
  /** `problem.visible`: entry i flags test i+1. Missing = hidden. */
  visible: readonly boolean[];
  /** Lesson exercises only; practice and contests use `problem_default`. */
  mode?: TestVisibility;
};

/**
 * The one visibility rule: may this viewer see test `index` (1-based, as in
 * `JudgeReport`)? Used for the exercise "Test cases" card, practice samples
 * and failing-test redaction, so they can't disagree.
 */
export function isTestVisible(index: number, ctx: VisibilityContext): boolean {
  if (ctx.fullAccess) return true;
  switch (ctx.mode ?? "problem_default") {
    case "show_all":
      return true;
    case "hide_all":
      return false;
    default:
      return ctx.visible[index - 1] === true;
  }
}

export interface VisibleTest {
  /** 1-based, the test's number in the problem (and in judge reports). */
  index: number;
  input: string;
  output: string;
}

/** The tests a viewer may see, keeping their original numbers. */
export function visibleTests(
  inputs: readonly string[],
  outputs: readonly string[],
  ctx: VisibilityContext,
): { tests: VisibleTest[]; hiddenCount: number } {
  const tests = inputs.flatMap((input, i) =>
    isTestVisible(i + 1, ctx)
      ? [{ index: i + 1, input, output: outputs[i] ?? "" }]
      : [],
  );
  return { tests, hiddenCount: inputs.length - tests.length };
}

const TIMEOUT_ACTUAL = "Execution timed out";

const VERDICT_KIND: Partial<Record<SubmissionStatus, FailureKind>> = {
  WRONG_ANSWER: "wrong_answer",
  TIME_LIMIT_EXCEEDED: "time_limit",
  MEMORY_LIMIT_EXCEEDED: "memory_limit",
  COMPILATION_ERROR: "compile_error",
  RUNTIME_ERROR: "runtime_error",
  ERROR: "judge_error",
};

/** Prefers the report's verdict; old reports fall back to text sniffing. */
export function failureKind(
  f: TestCaseResult,
  verdict?: SubmissionStatus,
): FailureKind {
  const fromVerdict = verdict && VERDICT_KIND[verdict];
  if (fromVerdict) return fromVerdict;
  if (f.error?.startsWith("Compilation Error")) return "compile_error";
  if (f.actual === TIMEOUT_ACTUAL) return "time_limit";
  if (f.error) return "runtime_error";
  return "wrong_answer";
}

export function parseReport(raw: string | null): JudgeReport | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "total_tests" in parsed) {
      return parsed as JudgeReport;
    }
  } catch {}
  return null;
}

function redactFailure(
  f: TestCaseResult,
  ctx: VisibilityContext,
  verdict?: SubmissionStatus,
): TestCaseResult {
  const kind = failureKind(f, verdict);
  if (isTestVisible(f.index, ctx)) return { ...f, failure_kind: kind };

  // Hidden test: verdict and test number only. `actual` and stderr go too,
  // since code can echo the input there. Compiler output doesn't depend on
  // the input, so it stays.
  return {
    index: f.index,
    failure_kind: kind,
    redacted: true,
    ...(kind === "compile_error" ? { error: f.error } : {}),
  };
}

/**
 * Returns `raw` with the failing test's details limited to what the viewer
 * may see. Non-report output (old rows, raw crash text) passes through.
 */
export function redactReport(
  raw: string | null,
  ctx: VisibilityContext,
): string | null {
  const report = parseReport(raw);
  if (!report?.failure_details) return raw;

  return JSON.stringify({
    ...report,
    failure_details: redactFailure(report.failure_details, ctx, report.verdict),
  });
}

/**
 * Redacts a practice/contest submission row that has its `problem` loaded.
 * Only the problem's creator gets full access; a contest owner who didn't
 * write the problem is treated like any participant.
 */
export function redactSubmission<
  T extends {
    output: string | null;
    problem: { createdBy: string; visible: boolean[] };
  },
>(row: T, viewerId: string): T {
  return {
    ...row,
    output: redactReport(row.output, {
      fullAccess: row.problem.createdBy === viewerId,
      visible: row.problem.visible,
    }),
  };
}

/**
 * Visibility for a lesson exercise. `fullAccess` (the problem's author, class
 * managers and admins; see `canSeeAllExerciseTests`) sees everything;
 * everyone else gets the lesson's mode.
 */
export function exerciseVisibilityContext(
  found: {
    problem: { visible: boolean[] };
    lesson: { testVisibility: TestVisibility };
  },
  fullAccess: boolean,
): VisibilityContext {
  return {
    fullAccess,
    visible: found.problem.visible,
    mode: found.lesson.testVisibility,
  };
}
