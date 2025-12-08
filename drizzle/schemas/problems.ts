import { relations } from "drizzle-orm";
import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { problemOnContest, user } from "./users";

const ProblemDifficulty = pgEnum("problem_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export type ProblemDifficulty = (typeof ProblemDifficulty.enumValues)[number];

export const problem = pgTable("problem", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: ProblemDifficulty(),
  createdBy: text("created_by").notNull(),
  inputs: text("inputs").array().notNull(),
  outputs: text("outputs").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Problem = typeof problem.$inferSelect;

export const problemRelations = relations(problem, ({ many, one }) => ({
  contests: many(problemOnContest),
  user: one(user, {
    fields: [problem.createdBy],
    references: [user.id],
  }),
}));

export type CreateProblemInput = typeof problem.$inferInsert;
