import { relations } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { problemOnContest, user } from "./users";

export const problemCodeSeq = pgSequence("problem_code_seq", {
  startWith: 0,
  minValue: 0,
});

export const ProblemDifficulty = pgEnum("problem_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export type ProblemDifficulty = (typeof ProblemDifficulty.enumValues)[number];

// Order matters: the picker lists tags in this order, grouped by
// PROBLEM_TAG_GROUPS below.
export const ProblemTag = pgEnum("problem_tag", [
  // Fundamentals — intro-programming topics
  "input-output",
  "conditionals",
  "loops",
  "arrays",
  "matrices",
  "strings",
  "functions",
  "recursion",
  // Algorithms — competitive-programming techniques
  "math",
  "number-theory",
  "combinatorics",
  "geometry",
  "sorting",
  "binary-search",
  "two-pointers",
  "greedy",
  "brute-force",
  "simulation",
  "dynamic-programming",
  "graphs",
  "trees",
  "shortest-paths",
  "data-structures",
  "bit-manipulation",
]);

export type ProblemTag = (typeof ProblemTag.enumValues)[number];

// Keys are permanent (Postgres enum values can't be cheaply removed or
// renamed); only their localized labels under `ProblemTags` in messages/ change.
export const PROBLEM_TAGS = ProblemTag.enumValues;

export const PROBLEM_TAG_GROUPS = {
  fundamentals: PROBLEM_TAGS.slice(0, PROBLEM_TAGS.indexOf("math")),
  algorithms: PROBLEM_TAGS.slice(PROBLEM_TAGS.indexOf("math")),
} as const satisfies Record<string, readonly ProblemTag[]>;

// How the judge compares a run's stdout with the declared output (see
// judge/src/compare.rs). `checker` runs the author's `problemChecker`.
export const ProblemCompareMode = pgEnum("problem_compare_mode", [
  "exact",
  "tokens",
  "float",
  "checker",
]);

export type ProblemCompareMode = (typeof ProblemCompareMode.enumValues)[number];

export const ProblemStatus = pgEnum("problem_status", ["draft", "published"]);

export const problem = pgTable("problem", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").default("Untitled Problem").notNull(),
  slug: text("slug").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description").default("").notNull(),
  narrative: text("narrative"),
  status: ProblemStatus().default("draft").notNull(),
  difficulty: ProblemDifficulty(),
  tags: ProblemTag().array().default([]).notNull(),
  createdBy: text("created_by").notNull(),
  inputs: text("inputs").array().default([]).notNull(),
  outputs: text("outputs").array().default([]).notNull(),
  exampleCount: integer("example_count").default(1).notNull(),
  timeLimitMs: integer("time_limit_ms").default(1000).notNull(),
  memoryLimitMb: integer("memory_limit_mb").default(512).notNull(),
  // Problems created before compare modes existed were migrated to `exact`.
  compareMode: ProblemCompareMode("compare_mode").default("tokens").notNull(),
  floatEpsilon: doublePrecision("float_epsilon").default(0.000001).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Problem = typeof problem.$inferSelect;
export type ProblemPreview = Omit<Problem, "inputs" | "outputs">;

export const problemRelations = relations(problem, ({ many, one }) => ({
  contests: many(problemOnContest),
  user: one(user, {
    fields: [problem.createdBy],
    references: [user.id],
  }),
}));
