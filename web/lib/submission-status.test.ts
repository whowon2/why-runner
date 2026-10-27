import { describe, expect, test } from "bun:test";
import { SubmissionStatus } from "@/drizzle/schemas/submissions";
import { isFinalFailure, isPendingStatus, statusTone } from "./submission-status";

describe("submission status helpers", () => {
  test("every status is passed, pending, constraint-related or a final failure", () => {
    for (const status of SubmissionStatus.enumValues) {
      const buckets = [
        status === "PASSED",
        status === "CONSTRAINT_VIOLATION",
        isPendingStatus(status),
        isFinalFailure(status),
      ].filter(Boolean);
      expect(buckets.length).toBe(1);
    }
  });

  test("new verdicts and legacy FAILED/ERROR are final failures", () => {
    for (const status of [
      "WRONG_ANSWER",
      "TIME_LIMIT_EXCEEDED",
      "MEMORY_LIMIT_EXCEEDED",
      "COMPILATION_ERROR",
      "RUNTIME_ERROR",
      "FAILED",
      "ERROR",
    ] as const) {
      expect(isFinalFailure(status)).toBe(true);
    }
    expect(isFinalFailure("PASSED")).toBe(false);
    expect(isFinalFailure(null)).toBe(false);
  });

  test("every status has a tone; unknown values fall back", () => {
    for (const status of SubmissionStatus.enumValues) {
      expect(statusTone(status)).not.toBe("text-muted-foreground");
    }
    expect(statusTone("SOMETHING_NEW")).toBe("text-muted-foreground");
  });
});
