import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { problem } from "./problems";
import { Language, SubmissionStatus } from "./submissions";

// Records a professor's pre-publish "does my declared I/O actually match my
// reference solution?" check. Deliberately NOT the `submission` table: these
// runs must never be able to leak into student-facing leaderboards,
// submission history, or contest exports, so they live in their own table
// that nothing student-facing ever reads from.
export const problemValidation = pgTable("problem_validation", {
  id: uuid("id").defaultRandom().primaryKey(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  language: Language("language").notNull(),
  status: SubmissionStatus("status").default("PENDING").notNull(),
  output: text("output"),
  // Content hash of the problem's inputs/outputs at the moment this run was
  // queued. Compared against a fresh hash of the problem's current
  // inputs/outputs to decide whether a PASSED run is still valid or stale.
  ioHash: text("io_hash").notNull(),
  runtimeMs: integer("runtime_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type ProblemValidation = typeof problemValidation.$inferSelect;
export type CreateProblemValidationInput =
  typeof problemValidation.$inferInsert;

export const problemValidationRelations = relations(
  problemValidation,
  ({ one }) => ({
    problem: one(problem, {
      fields: [problemValidation.problemId],
      references: [problem.id],
    }),
  }),
);

// The reference solution itself lives separately from problem validation
// *runs*: it's edited alongside the draft's I/O and persists independently
// of any single validation attempt. 1:1 with `problem` (kept out of the
// `problem` table itself to avoid a `problems.ts` <-> `submissions.ts`
// circular import, since this needs the `Language` enum at column-definition
// time).
export const problemReferenceSolution = pgTable("problem_reference_solution", {
  problemId: uuid("problem_id")
    .primaryKey()
    .references(() => problem.id, { onDelete: "cascade" }),
  code: text("code").default("").notNull(),
  language: Language("language"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type ProblemReferenceSolution =
  typeof problemReferenceSolution.$inferSelect;

export const problemReferenceSolutionRelations = relations(
  problemReferenceSolution,
  ({ one }) => ({
    problem: one(problem, {
      fields: [problemReferenceSolution.problemId],
      references: [problem.id],
    }),
  }),
);
