/**
 * The judge writes the full `JudgeReport` (see judge/src/models.rs) to
 * `submission.output`, including the first failing test's input, expected
 * output, actual output and stderr, hidden tests too. Every server action
 * that returns `output` to a client must pass it through `redactReport` so
 * hidden tests can't be read back (submission-feedback-visibility spec).
 *
 * Pure module: no DB, runs in `bun test`.
 */

export type FailureKind =
  | "compile_error"
  | "time_limit"
  | "runtime_error"
  | "wrong_answer";

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
  total_tests: number;
  passed_count: number;
  failure_details?: TestCaseResult | null;
  constraint_violation?: unknown;
}

export type RedactContext = {
  /** Problem owner (or, for exercises, the lesson owner): sees everything. */
  fullAccess: boolean;
  /** Tests 1..exampleCount are public samples. */
  exampleCount: number;
  /** Set for lesson exercise submissions. */
  exercise?: { showOutputs: boolean };
};

const TIMEOUT_ACTUAL = "Execution timed out";

export function failureKind(f: TestCaseResult): FailureKind {
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
  ctx: RedactContext,
): TestCaseResult {
  const kind = failureKind(f);
  if (ctx.fullAccess) return { ...f, failure_kind: kind };

  // Exercise inputs are already shown on the exercise page; only the
  // expected output follows the lesson's showOutputs toggle.
  if (ctx.exercise) {
    if (ctx.exercise.showOutputs) return { ...f, failure_kind: kind };
    const { expected: _expected, ...rest } = f;
    return { ...rest, failure_kind: kind, redacted: true };
  }

  if (f.index <= ctx.exampleCount) return { ...f, failure_kind: kind };

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
  ctx: RedactContext,
): string | null {
  const report = parseReport(raw);
  if (!report?.failure_details) return raw;

  return JSON.stringify({
    ...report,
    failure_details: redactFailure(report.failure_details, ctx),
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
    problem: { createdBy: string; exampleCount: number };
  },
>(row: T, viewerId: string): T {
  return {
    ...row,
    output: redactReport(row.output, {
      fullAccess: row.problem.createdBy === viewerId,
      exampleCount: row.problem.exampleCount,
    }),
  };
}
