import { describe, expect, test } from "bun:test";
import { computeExerciseScore, parseTestCounts } from "./exercise-score";

describe("parseTestCounts", () => {
  test("reads passed/total", () => {
    expect(
      parseTestCounts(JSON.stringify({ passed_count: 3, total_tests: 4 })),
    ).toEqual({ passed: 3, total: 4 });
  });

  test("null for missing, invalid or empty reports", () => {
    expect(parseTestCounts(null)).toBeNull();
    expect(parseTestCounts("")).toBeNull();
    expect(parseTestCounts("not json")).toBeNull();
    expect(parseTestCounts("null")).toBeNull();
    expect(parseTestCounts(JSON.stringify({ passed_count: 0 }))).toBeNull();
    expect(
      parseTestCounts(JSON.stringify({ passed_count: 0, total_tests: 0 })),
    ).toBeNull();
  });
});

describe("computeExerciseScore", () => {
  test("fraction or 0", () => {
    expect(
      computeExerciseScore(JSON.stringify({ passed_count: 1, total_tests: 4 })),
    ).toBe(0.25);
    expect(computeExerciseScore(undefined)).toBe(0);
    expect(computeExerciseScore("{")).toBe(0);
  });
});
