import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { problem } from "./problems";
import { user } from "./users";

export const Language = pgEnum("language", [
  "c",
  "cpp",
  "java",
  "python",
  "portugol",
  "rust",
]);

export type Language = (typeof Language.enumValues)[number];

export const SubmissionStatus = pgEnum("submission_status", [
  "PENDING",
  "PASSED",
  "FAILED",
  "ERROR",
  "RUNNING",
  // Passed all test cases but violated a structural or algorithm-requirement
  // solution constraint (see `lessonConstraint`). Distinct from PASSED so
  // leaderboard/history callsites that switch on status can't silently treat
  // it as passing; distinct from FAILED/ERROR since I/O grading succeeded.
  "CONSTRAINT_VIOLATION",
  // Transient state: I/O + structural checks passed and the problem has an
  // active algorithm-requirement constraint, awaiting the web-side AI
  // classification pass before the judge's verdict is final.
  "PENDING_CONSTRAINT_CLASSIFICATION",
]);

export const submission = pgTable("submission", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: SubmissionStatus().default("PENDING").notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  code: text("code").notNull(),
  language: Language(),
  questionLetter: text("question_letter"),
  output: text("output"),
  // Set only for CONSTRAINT_VIOLATION: which constraint was violated and,
  // for algorithm-requirement violations, the AI classification's rationale.
  constraintViolationDetail: text("constraint_violation_detail"),
  runtimeMs: integer("runtime_ms"),
  memoryKb: integer("memory_kb"),
  codeSize: integer("code_size"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  contestId: uuid("contest_id"),
  // Set only when this submission was made against a lesson exercise (see
  // `createLessonSubmission`) — bare uuid with no FK, same convention as
  // `contestId` above (avoids a `submissions.ts` <-> `lessons.ts` circular
  // import, since `lessons.ts` already imports from this file). Solution
  // constraints only ever apply when this is set: never for contests, never
  // for standalone/practice submissions to the same problem.
  lessonId: uuid("lesson_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Submission = typeof submission.$inferSelect;

export const submissionRelations = relations(submission, ({ one }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [submission.problemId],
    references: [problem.id],
  }),
}));

export type CreateSubmissionInput = typeof submission.$inferInsert;
