import { describe, expect, test } from "bun:test";
import {
  buildClassResults,
  CLASS_RESULTS_HEADER,
  type ClassResultsInput,
  classResultsToCsv,
} from "./class-results";
import { buildGradebook } from "./gradebook";

const report = (passed: number, total: number) =>
  JSON.stringify({ passed_count: passed, total_tests: total });

const at = (s: string) => new Date(s);

const snapshot = (
  output: string | null,
  status: "PASSED" | "WRONG_ANSWER" = "WRONG_ANSWER",
) => ({
  status,
  output,
  language: "python" as const,
  createdAt: at("2026-10-10T12:00:00Z"),
});

function input(overrides: Partial<ClassResultsInput> = {}): ClassResultsInput {
  return {
    lessons: [
      {
        id: "A",
        title: "Loops",
        dueDate: at("2026-10-20T00:00:00Z"),
        exercises: [
          { id: "a1", problemCode: "P1", problemTitle: "Sum" },
          { id: "a2", problemCode: "P2", problemTitle: "Max" },
        ],
      },
      {
        id: "B",
        title: "Strings",
        dueDate: null,
        exercises: [{ id: "b1", problemCode: "P3", problemTitle: "Reverse" }],
      },
    ],
    students: [
      { id: "u2", name: "Zoe", username: "zoe" },
      { id: "u1", name: "Ana", username: "ana" },
    ],
    lessonSubmissions: [
      {
        userId: "u1",
        lessonId: "A",
        submittedAt: at("2026-10-21T00:00:00Z"),
        reviewedAt: at("2026-10-22T00:00:00Z"),
      },
      {
        userId: "u1",
        lessonId: "B",
        submittedAt: at("2026-10-01T00:00:00Z"),
        reviewedAt: null,
      },
      {
        userId: "u2",
        lessonId: "A",
        submittedAt: at("2026-10-19T00:00:00Z"),
        reviewedAt: null,
      },
    ],
    completions: [
      {
        userId: "u1",
        exerciseId: "a1",
        feedback: 'Good "loop"\nbut slow',
        submission: snapshot(report(3, 4)),
      },
      // a2 handed in without a submission.
      { userId: "u1", exerciseId: "a2", feedback: null, submission: null },
      {
        userId: "u2",
        exerciseId: "a1",
        feedback: null,
        submission: snapshot(report(2, 2), "PASSED"),
      },
      // Unparseable output.
      {
        userId: "u1",
        exerciseId: "b1",
        feedback: null,
        submission: snapshot("not json"),
      },
    ],
    activity: [
      {
        userId: "u2",
        exerciseId: "b1",
        attempts: 4,
        lastAttemptAt: at("2026-10-25T00:00:00Z"),
        everPassed: true,
      },
    ],
    ...overrides,
  };
}

describe("buildClassResults", () => {
  test("one row per student × exercise, ordered", () => {
    const rows = buildClassResults(input());
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => `${r.student.name}/${r.exercise.id}`)).toEqual([
      "Ana/a1",
      "Ana/a2",
      "Ana/b1",
      "Zoe/a1",
      "Zoe/a2",
      "Zoe/b1",
    ]);
    expect(rows.map((r) => r.position)).toEqual([1, 2, 1, 1, 2, 1]);
  });

  test("lesson state: late, on time, no due date, not submitted", () => {
    const rows = buildClassResults(input());
    expect(rows[0].lessonState).toBe("late");
    expect(rows[2].lessonState).toBe("on_time");
    expect(rows[3].lessonState).toBe("on_time");
    expect(rows[5].lessonState).toBe("not_submitted");
  });

  test("graded snapshot columns", () => {
    const [a1] = buildClassResults(input());
    expect(a1).toMatchObject({
      verdict: "WRONG_ANSWER",
      passedTests: 3,
      totalTests: 4,
      score: 0.75,
      language: "python",
      reviewedAt: at("2026-10-22T00:00:00Z"),
    });
  });

  test("handed in without snapshot → score 0, empty verdict", () => {
    const a2 = buildClassResults(input())[1];
    expect(a2).toMatchObject({
      verdict: null,
      passedTests: null,
      totalTests: null,
      score: 0,
    });
  });

  test("unparseable output → empty counts, score 0, verdict kept", () => {
    const b1 = buildClassResults(input())[2];
    expect(b1).toMatchObject({
      verdict: "WRONG_ANSWER",
      passedTests: null,
      score: 0,
    });
  });

  test("not submitted: empty graded columns, activity still reported", () => {
    const zoeB1 = buildClassResults(input())[5];
    expect(zoeB1).toMatchObject({
      lessonState: "not_submitted",
      lessonSubmittedAt: null,
      verdict: null,
      score: null,
      language: null,
      attempts: 4,
      lastAttemptAt: at("2026-10-25T00:00:00Z"),
      everPassed: true,
    });
  });

  test("no activity defaults", () => {
    const zoeA2 = buildClassResults(input())[4];
    expect(zoeA2).toMatchObject({
      attempts: 0,
      lastAttemptAt: null,
      everPassed: false,
    });
  });

  test("scores equal the gradebook cells", () => {
    const i = input();
    const rows = buildClassResults(i);
    const gradebook = buildGradebook({
      lessons: i.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.id,
        dueDate: l.dueDate,
        exercises: l.exercises.map((e) => ({
          id: e.id,
          problemTitle: e.problemTitle,
        })),
      })),
      students: i.students.map((s) => ({ ...s, image: null })),
      lessonSubmissions: i.lessonSubmissions,
      completions: i.completions.map((c) => ({
        userId: c.userId,
        exerciseId: c.exerciseId,
        output: c.submission?.output ?? null,
      })),
    });
    expect(rows.map((r) => r.score)).toEqual(
      gradebook.rows.flatMap((r) => r.cells),
    );
  });

  test("no students or lessons → no rows", () => {
    expect(buildClassResults(input({ students: [] }))).toEqual([]);
    expect(buildClassResults(input({ lessons: [] }))).toEqual([]);
  });
});

describe("classResultsToCsv", () => {
  test("header only when empty", () => {
    const csv = classResultsToCsv([]);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(1);
    expect(csv).toContain(`"${CLASS_RESULTS_HEADER[0]}"`);
  });

  test("formats dates, booleans, scores and quotes feedback", () => {
    const csv = classResultsToCsv(buildClassResults(input()));
    const first = csv.split("\r\n")[1];
    expect(first).toStartWith('"Ana","ana","Loops","2026-10-20","1","P1"');
    expect(first).toContain(
      '"late","2026-10-21T00:00:00.000Z","2026-10-22T00:00:00.000Z","WRONG_ANSWER","3","4","0.75","python"',
    );
    expect(first).toContain('"0","","false","Good ""loop""\nbut slow"');
  });

  test("formula-looking names are neutralised", () => {
    const csv = classResultsToCsv(
      buildClassResults(
        input({
          students: [{ id: "u1", name: "=HYPERLINK()", username: "x" }],
        }),
      ),
    );
    expect(csv).toContain(`"'=HYPERLINK()"`);
  });
});
