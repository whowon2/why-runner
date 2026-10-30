import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { contest } from "./contests";
import { exercise } from "./lessons";
import { problem } from "./problems";
import { Language } from "./submissions";
import { user } from "./users";

// Outcome of an ungraded run. Deliberately not `submission_status`: a run is
// never compared against expected output, so there is no PASSED/WRONG_ANSWER.
// Must match `CodeRunStatus` in judge/src/models.rs (scripts/check-enum-sync.ts).
export const CodeRunStatus = pgEnum("code_run_status", [
  "PENDING",
  "RUNNING",
  "OK",
  "RUNTIME_ERROR",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "COMPILATION_ERROR",
  "ERROR",
]);

export type CodeRunStatus = (typeof CodeRunStatus.enumValues)[number];

// "Run with custom input": one sandboxed execution with the student's own
// stdin. Its own table (not a `submission` kind) so no grading, gradebook,
// statistics or standings query can ever count it. The judge deletes rows
// older than 24 h.
export const codeRun = pgTable(
  "code_run",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Only the problem's time limit is read for a run, never its tests.
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    contestId: uuid("contest_id").references(() => contest.id, {
      onDelete: "cascade",
    }),
    exerciseId: uuid("exercise_id").references(() => exercise.id, {
      onDelete: "cascade",
    }),
    language: Language("language").notNull(),
    code: text("code").notNull(),
    stdin: text("stdin").default("").notNull(),
    status: CodeRunStatus("status").default("PENDING").notNull(),
    stdout: text("stdout"),
    stderr: text("stderr"),
    stdoutTruncated: boolean("stdout_truncated").default(false).notNull(),
    stderrTruncated: boolean("stderr_truncated").default(false).notNull(),
    exitCode: integer("exit_code"),
    runtimeMs: integer("runtime_ms"),
    memoryKb: integer("memory_kb"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("code_run_user_created_idx").on(t.userId, t.createdAt),
    index("code_run_status_created_idx").on(t.status, t.createdAt),
  ],
);

export type CodeRun = typeof codeRun.$inferSelect;

export const codeRunRelations = relations(codeRun, ({ one }) => ({
  user: one(user, { fields: [codeRun.userId], references: [user.id] }),
  problem: one(problem, {
    fields: [codeRun.problemId],
    references: [problem.id],
  }),
}));
