import { describe, expect, test } from "bun:test";
import {
  buildGradebook,
  formatScore,
  type GradebookInput,
  gradebookToCsv,
} from "./gradebook";

const report = (passed: number, total: number) =>
  JSON.stringify({ passed_count: passed, total_tests: total });

const student = (id: string, name: string) => ({
  id,
  name,
  username: id,
  image: null,
});

function input(overrides: Partial<GradebookInput> = {}): GradebookInput {
  return {
    lessons: [
      {
        id: "A",
        title: "Loops",
        slug: "loops",
        dueDate: null,
        exercises: [
          { id: "a1", problemTitle: "Sum" },
          { id: "a2", problemTitle: "Max" },
        ],
      },
      {
        id: "B",
        title: "Strings",
        slug: "strings",
        dueDate: null,
        exercises: [{ id: "b1", problemTitle: "Reverse" }],
      },
    ],
    students: [student("u2", "Zoe"), student("u1", "Ana")],
    lessonSubmissions: [{ userId: "u1", lessonId: "A" }],
    completions: [
      { userId: "u1", exerciseId: "a1", output: report(5, 10) },
      { userId: "u1", exerciseId: "a2", output: report(2, 2) },
      // Snapshot exists but the lesson wasn't handed in — must not count.
      { userId: "u2", exerciseId: "b1", output: report(1, 1) },
    ],
    ...overrides,
  };
}

describe("buildGradebook", () => {
  test("rows sorted by name, max = exercise count", () => {
    const g = buildGradebook(input());
    expect(g.rows.map((r) => r.student.name)).toEqual(["Ana", "Zoe"]);
    expect(g.maxTotal).toBe(3);
  });

  test("lesson total sums fractions, unsubmitted lesson is null", () => {
    const [ana] = buildGradebook(input()).rows;
    expect(ana.cells).toEqual([0.5, 1, null]);
    expect(ana.lessonTotals).toEqual([1.5, null]);
    expect(ana.total).toBe(1.5);
  });

  test("student with no submissions has all nulls and total 0", () => {
    const zoe = buildGradebook(input()).rows[1];
    expect(zoe.cells).toEqual([null, null, null]);
    expect(zoe.lessonTotals).toEqual([null, null]);
    expect(zoe.total).toBe(0);
  });

  test("submitted lesson with missing or unparseable output scores 0", () => {
    const g = buildGradebook(
      input({
        lessonSubmissions: [{ userId: "u1", lessonId: "A" }],
        completions: [{ userId: "u1", exerciseId: "a1", output: "not json" }],
      }),
    );
    expect(g.rows[0].cells).toEqual([0, 0, null]);
    expect(g.rows[0].lessonTotals).toEqual([0, null]);
  });

  test("no lessons gives empty rows", () => {
    const g = buildGradebook(input({ lessons: [] }));
    expect(g.maxTotal).toBe(0);
    expect(g.rows[0].cells).toEqual([]);
    expect(g.rows[0].total).toBe(0);
  });
});

describe("formatScore", () => {
  test("null is empty, rounds to 4 places, dot decimal", () => {
    expect(formatScore(null)).toBe("");
    expect(formatScore(1 / 3)).toBe("0.3333");
    expect(formatScore(1.5)).toBe("1.5");
    expect(formatScore(0)).toBe("0");
  });
});

describe("gradebookToCsv", () => {
  test("header and rows match the matrix", () => {
    const lines = gradebookToCsv(buildGradebook(input()))
      .replace(/^﻿/, "")
      .split("\r\n");
    expect(lines[0]).toBe(
      '"name","username","Loops / Sum","Loops / Max","Strings / Reverse","Loops (total)","Strings (total)","total","max"',
    );
    expect(lines[1]).toBe('"Ana","u1","0.5","1","","1.5","","1.5","3"');
    expect(lines[2]).toBe('"Zoe","u2","","","","","","0","3"');
    expect(lines[3]).toBe("");
  });

  test("starts with BOM and neutralises formula-looking names", () => {
    const csv = gradebookToCsv(
      buildGradebook(input({ students: [student("u1", "=HYPERLINK()")] })),
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK()"`);
  });
});
