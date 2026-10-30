import { describe, expect, test } from "bun:test";
import {
  exerciseVisibilityContext,
  isTestVisible,
  parseReport,
  redactReport,
  type VisibilityContext,
  visibleTests,
} from "./judge-report";

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

// Tests 1-2 are examples, as `exampleCount: 2` was before per-test flags.
const student: VisibilityContext = {
  fullAccess: false,
  visible: [true, true, false, false, false, false, false, false, false, false],
};

function failure(raw: string | null) {
  const parsed = parseReport(raw);
  if (!parsed?.failure_details) throw new Error("no failure details");
  return parsed.failure_details;
}

describe("redactReport", () => {
  test("owner sees everything on a hidden test", () => {
    const f = failure(
      redactReport(wrongAnswer(7), { ...student, fullAccess: true }),
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
    const out = redactReport(compileError, { fullAccess: false, visible: [] });
    expect(out).not.toContain("SECRET");
    const f = failure(out);
    expect(f.failure_kind).toBe("compile_error");
    expect(f.error).toContain("main.c:1: error");
  });

  test("contest owner without problem ownership is redacted", () => {
    // Callers pass fullAccess only for the problem's creator.
    expect(redactReport(wrongAnswer(9), student)).not.toContain("SECRET");
  });

  test("non-leading example is shown in full", () => {
    const f = failure(
      redactReport(wrongAnswer(3), {
        fullAccess: false,
        visible: [false, false, true],
      }),
    );
    expect(f.input).toBe("SECRET_IN");
    expect(f.expected).toBe("SECRET_OUT");
    expect(f.redacted).toBeUndefined();
  });

  test("missing visible entry counts as hidden", () => {
    const out = redactReport(wrongAnswer(4), {
      fullAccess: false,
      visible: [true],
    });
    expect(out).not.toContain("SECRET");
  });

  test("show_all lesson reveals a hidden test", () => {
    const f = failure(
      redactReport(wrongAnswer(5), { ...student, mode: "show_all" }),
    );
    expect(f.input).toBe("SECRET_IN");
    expect(f.expected).toBe("SECRET_OUT");
    expect(f.actual).toBe("echo SECRET_IN");
  });

  test("hide_all lesson hides an example but keeps compiler output", () => {
    const hideAll: VisibilityContext = { ...student, mode: "hide_all" };
    const out = redactReport(wrongAnswer(1), hideAll);
    expect(out).not.toContain("SECRET");
    expect(failure(out)).toEqual({
      index: 1,
      failure_kind: "wrong_answer",
      redacted: true,
    });

    const compiled = failure(redactReport(compileError, hideAll));
    expect(compiled.error).toContain("main.c:1: error");
  });

  test("full access overrides hide_all", () => {
    const f = failure(
      redactReport(wrongAnswer(5), {
        ...student,
        fullAccess: true,
        mode: "hide_all",
      }),
    );
    expect(f.expected).toBe("SECRET_OUT");
  });

  test("problem_default lesson follows the problem's flags", () => {
    const ctx: VisibilityContext = { ...student, mode: "problem_default" };
    expect(failure(redactReport(wrongAnswer(2), ctx)).expected).toBe(
      "SECRET_OUT",
    );
    // No partial state: a hidden test never keeps its input.
    expect(redactReport(wrongAnswer(5), ctx)).not.toContain("SECRET");
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

describe("isTestVisible", () => {
  const visible = [true, false, true];

  test("problem_default follows the 1-based flags", () => {
    const ctx = { fullAccess: false, visible };
    expect([1, 2, 3, 4].map((i) => isTestVisible(i, ctx))).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  test("lesson modes override the flags", () => {
    expect(
      isTestVisible(2, { fullAccess: false, visible, mode: "show_all" }),
    ).toBe(true);
    expect(
      isTestVisible(1, { fullAccess: false, visible, mode: "hide_all" }),
    ).toBe(false);
  });

  test("full access sees every test", () => {
    expect(
      isTestVisible(2, { fullAccess: true, visible, mode: "hide_all" }),
    ).toBe(true);
  });
});

describe("visibleTests", () => {
  const inputs = ["a", "b", "c", "d"];
  const outputs = ["A", "B", "C", "D"];

  test("keeps original numbers and counts hidden tests", () => {
    expect(
      visibleTests(inputs, outputs, {
        fullAccess: false,
        visible: [true, false, true, false],
      }),
    ).toEqual({
      tests: [
        { index: 1, input: "a", output: "A" },
        { index: 3, input: "c", output: "C" },
      ],
      hiddenCount: 2,
    });
  });

  test("hide_all hides everything", () => {
    expect(
      visibleTests(inputs, outputs, {
        fullAccess: false,
        visible: [true, true, true, true],
        mode: "hide_all",
      }),
    ).toEqual({ tests: [], hiddenCount: 4 });
  });
});

describe("exerciseVisibilityContext", () => {
  const found = {
    problem: { visible: [true, false] },
    lesson: { testVisibility: "hide_all" as const },
  };

  test("full access passes through", () => {
    expect(exerciseVisibilityContext(found, true).fullAccess).toBe(true);
  });

  test("students get the lesson mode and the problem's flags", () => {
    expect(exerciseVisibilityContext(found, false)).toEqual({
      fullAccess: false,
      visible: [true, false],
      mode: "hide_all",
    });
  });
});
