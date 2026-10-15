import { describe, expect, test } from "bun:test";
import { parseReport, type RedactContext, redactReport } from "./judge-report";

function report(failure: Record<string, unknown>) {
  return JSON.stringify({
    passed: false,
    total_tests: 10,
    passed_count: 4,
    failure_details: failure,
    constraint_violation: null,
  });
}

const wrongAnswer = (index: number) =>
  report({
    index,
    input: "SECRET_IN",
    expected: "SECRET_OUT",
    actual: "echo SECRET_IN",
    error: null,
  });

const runtimeError = (index: number) =>
  report({
    index,
    input: "SECRET_IN",
    expected: "SECRET_OUT",
    actual: "",
    error: "Traceback: SECRET_IN",
  });

const timeLimit = (index: number) =>
  report({
    index,
    input: "SECRET_IN",
    expected: "SECRET_OUT",
    actual: "Execution timed out",
    error: "Time Limit Exceeded (1s)",
  });

const compileError = report({
  index: 1,
  input: "SECRET_IN",
  expected: "SECRET_OUT",
  actual: "",
  error: "Compilation Error:\nmain.c:1: error",
});

const student: RedactContext = { fullAccess: false, exampleCount: 2 };

function failure(raw: string | null) {
  const parsed = parseReport(raw);
  if (!parsed?.failure_details) throw new Error("no failure details");
  return parsed.failure_details;
}

describe("redactReport", () => {
  test("owner sees everything on a hidden test", () => {
    const f = failure(
      redactReport(wrongAnswer(7), { fullAccess: true, exampleCount: 2 }),
    );
    expect(f.input).toBe("SECRET_IN");
    expect(f.expected).toBe("SECRET_OUT");
    expect(f.failure_kind).toBe("wrong_answer");
    expect(f.redacted).toBeUndefined();
  });

  test("sample failure is shown in full", () => {
    const f = failure(redactReport(wrongAnswer(2), student));
    expect(f.input).toBe("SECRET_IN");
    expect(f.expected).toBe("SECRET_OUT");
    expect(f.actual).toBe("echo SECRET_IN");
  });

  for (const [name, raw, kind] of [
    ["wrong answer", wrongAnswer(5), "wrong_answer"],
    ["runtime error", runtimeError(5), "runtime_error"],
    ["time limit", timeLimit(5), "time_limit"],
  ] as const) {
    test(`hidden ${name} keeps only verdict and index`, () => {
      const out = redactReport(raw, student);
      expect(out).not.toContain("SECRET");
      const f = failure(out);
      expect(f).toEqual({ index: 5, failure_kind: kind, redacted: true });
    });
  }

  test("hidden-test redaction keeps the pass counts", () => {
    const parsed = parseReport(redactReport(wrongAnswer(5), student));
    expect(parsed?.passed_count).toBe(4);
    expect(parsed?.total_tests).toBe(10);
  });

  test("compile error keeps compiler output even with no samples", () => {
    const out = redactReport(compileError, {
      fullAccess: false,
      exampleCount: 0,
    });
    expect(out).not.toContain("SECRET");
    const f = failure(out);
    expect(f.failure_kind).toBe("compile_error");
    expect(f.error).toContain("main.c:1: error");
  });

  test("contest owner without problem ownership is redacted", () => {
    // Callers pass fullAccess only for the problem's creator.
    expect(redactReport(wrongAnswer(9), student)).not.toContain("SECRET");
  });

  test("exercise with showOutputs off hides only expected", () => {
    const f = failure(
      redactReport(wrongAnswer(5), {
        fullAccess: false,
        exampleCount: 1,
        exercise: { showOutputs: false },
      }),
    );
    expect(f.input).toBe("SECRET_IN");
    expect(f.actual).toBe("echo SECRET_IN");
    expect(f.expected).toBeUndefined();
    expect(f.redacted).toBe(true);
  });

  test("exercise with showOutputs on shows expected", () => {
    const f = failure(
      redactReport(wrongAnswer(5), {
        fullAccess: false,
        exampleCount: 1,
        exercise: { showOutputs: true },
      }),
    );
    expect(f.expected).toBe("SECRET_OUT");
  });

  test("passed report, null and non-JSON pass through", () => {
    const passed = JSON.stringify({
      passed: true,
      total_tests: 3,
      passed_count: 3,
      failure_details: null,
    });
    expect(redactReport(passed, student)).toBe(passed);
    expect(redactReport(null, student)).toBeNull();
    expect(redactReport("raw crash text", student)).toBe("raw crash text");
  });
});
