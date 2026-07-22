import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { problemOnContest, user } from "./users";

export const ProblemDifficulty = pgEnum("problem_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export type ProblemDifficulty = (typeof ProblemDifficulty.enumValues)[number];

export const problem = pgTable("problem", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  difficulty: ProblemDifficulty(),
  createdBy: text("created_by").notNull(),
  inputs: text("inputs").array().notNull(),
  outputs: text("outputs").array().notNull(),
  exampleCount: integer("example_count").default(1).notNull(),
  timeLimitMs: integer("time_limit_ms").default(1000).notNull(),
  memoryLimitMb: integer("memory_limit_mb").default(512).notNull(),
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

export type CreateProblemInput = Omit<
  typeof problem.$inferInsert,
  "createdBy" | "slug"
>;
