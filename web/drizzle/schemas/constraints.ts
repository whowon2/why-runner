import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { exercise } from "./lessons";

// Solution constraints are an *exercise* feature: they attach to a specific
// `exercise` row (one problem inside one professor-curated lesson), never to
// the underlying `problem` directly, and never apply to contests. The same
// problem can be reused as multiple exercises (or in a contest) without
// carrying constraints along with it — see design.md decision on scope.
//
// Two kinds: `structural` rules are mechanically checked by judge-side
// static analysis (one exercise may have many); `algorithm_requirement` is a
// natural-language description classified by an LLM (at most one per
// exercise, enforced by the partial unique index below).
export const ProblemConstraintKind = pgEnum("problem_constraint_kind", [
  "structural",
  "algorithm_requirement",
]);

export type ProblemConstraintKind =
  (typeof ProblemConstraintKind.enumValues)[number];

// Fixed v1 catalog of structural rule types (see design.md Non-Goals: no
// free-form rule DSL). `ruleParams` carries the type-specific parameters,
// e.g. `{ "maxDepth": 1 }` for max_loop_nesting_depth, or
// `{ "constructs": ["goto"] }` for forbidden_construct /
// required_construct (forbidden = none of these may appear; required =
// all of these must appear — same shape, opposite check).
export const StructuralConstraintRuleType = pgEnum(
  "structural_constraint_rule_type",
  ["max_loop_nesting_depth", "forbidden_construct", "required_construct"],
);

export type StructuralConstraintRuleType =
  (typeof StructuralConstraintRuleType.enumValues)[number];

export const exerciseConstraint = pgTable(
  "exercise_constraint",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "cascade" }),
    kind: ProblemConstraintKind("kind").notNull(),
    // Only set when kind = 'structural'.
    ruleType: StructuralConstraintRuleType("rule_type"),
    // Only set when kind = 'structural'; shape depends on ruleType.
    ruleParams: text("rule_params"),
    // Only set when kind = 'algorithm_requirement': the natural-language
    // description used as AI classification criteria.
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Enforces "at most one algorithm-requirement constraint per exercise" at
    // the DB level, not just in the server action.
    uniqueIndex("exercise_constraint_one_algo_requirement")
      .on(table.exerciseId)
      .where(sql`${table.kind} = 'algorithm_requirement'`),
    // At most one row per structural rule type per exercise — e.g. only one
    // "max loop nesting depth" row (creator edits its depth, doesn't add a
    // second one); multiple tokens for forbidden/required construct rules
    // go in that one row's `ruleParams.constructs` list instead of separate
    // rows. `ruleType` is NULL for algorithm_requirement rows, and Postgres
    // treats NULLs as distinct for uniqueness, so this index only ever
    // constrains structural rows.
    uniqueIndex("exercise_constraint_one_per_rule_type").on(
      table.exerciseId,
      table.ruleType,
    ),
  ],
);

export type ProblemConstraint = typeof exerciseConstraint.$inferSelect;
export type CreateProblemConstraintInput =
  typeof exerciseConstraint.$inferInsert;

export const exerciseConstraintRelations = relations(
  exerciseConstraint,
  ({ one }) => ({
    exercise: one(exercise, {
      fields: [exerciseConstraint.exerciseId],
      references: [exercise.id],
    }),
  }),
);
