import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { problem } from "./problems";
import { Language } from "./submissions";

// A problem's custom output checker (`problem.compareMode = 'checker'`).
// Kept out of `problem` on purpose: student-facing queries load whole
// problem rows, and the checker source must only reach the problem's author.
export const problemChecker = pgTable("problem_checker", {
  problemId: uuid("problem_id")
    .primaryKey()
    .references(() => problem.id, { onDelete: "cascade" }),
  language: Language("language").notNull(),
  code: text("code").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type ProblemChecker = typeof problemChecker.$inferSelect;

export const problemCheckerRelations = relations(problemChecker, ({ one }) => ({
  problem: one(problem, {
    fields: [problemChecker.problemId],
    references: [problem.id],
  }),
}));
