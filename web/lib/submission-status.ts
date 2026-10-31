/**
 * Shared knowledge about `submission.status` values for the UI. Pure module:
 * runs in `bun test`. Contest scoring has its own exhaustive switch
 * (`classifyStatus` in lib/contest/standings.ts).
 */
import type { Submission } from "@/drizzle/schema";

type SubmissionStatus = Submission["status"];

/** Verdicts of a submission the judge ran and rejected (legacy FAILED too). */
export const REJECTED_STATUSES = [
  "FAILED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "COMPILATION_ERROR",
  "RUNTIME_ERROR",
] as const satisfies readonly SubmissionStatus[];

/** Finished without passing: a rejection or a judge-side `ERROR`. */
export function isFinalFailure(status: SubmissionStatus | null | undefined) {
  return (
    status === "ERROR" ||
    (REJECTED_STATUSES as readonly string[]).includes(status ?? "")
  );
}

export function isPendingStatus(status: SubmissionStatus | null | undefined) {
  return (
    status === "PENDING" ||
    status === "RUNNING" ||
    status === "PENDING_CONSTRAINT_CLASSIFICATION"
  );
}

const TONE: Record<SubmissionStatus, string> = {
  PASSED: "text-success border-success",
  PENDING: "text-muted-foreground border-border",
  RUNNING: "text-primary border-primary",
  PENDING_CONSTRAINT_CLASSIFICATION: "text-indigo-500 border-indigo-500",
  CONSTRAINT_VIOLATION: "text-purple-500 border-purple-500",
  FAILED: "text-destructive border-destructive",
  WRONG_ANSWER: "text-destructive border-destructive",
  RUNTIME_ERROR: "text-rose-600 border-rose-600",
  TIME_LIMIT_EXCEEDED: "text-warning border-warning",
  MEMORY_LIMIT_EXCEEDED: "text-fuchsia-500 border-fuchsia-500",
  COMPILATION_ERROR: "text-yellow-600 border-yellow-600",
  ERROR: "text-orange-500 border-orange-500",
};

/** Text + border colour classes for a status (unknown values: muted). */
export function statusTone(status: string | null | undefined): string {
  return TONE[status as SubmissionStatus] ?? "text-muted-foreground";
}
